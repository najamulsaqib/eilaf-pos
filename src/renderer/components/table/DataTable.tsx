import { type CSSProperties, type ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@contexts/LocaleContext';

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: string;
  direction: SortDirection;
};

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: string | number;
  /** `true` is treated as `'left'` for backwards compatibility */
  pinned?: 'left' | 'right' | boolean;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  emptyMessage?: string;
  sortState?: SortState | null;
  onSortChange?: (nextSort: SortState | null) => void;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function getPinnedSide(
  pinned: DataTableColumn<unknown>['pinned'],
): 'left' | 'right' | null {
  if (!pinned) return null;
  if (pinned === true) return 'left';
  return pinned;
}

function parsePx(size: string | number | undefined): number {
  if (size === undefined) return 0;
  if (typeof size === 'number') return size;
  const m = size.match(/^(\d+(?:\.\d+)?)px$/);
  return m ? parseFloat(m[1]) : 0;
}

/** Pre-compute sticky offsets for all pinned columns. */
function buildPinOffsets<T>(
  columns: DataTableColumn<T>[],
): Record<string, number> {
  const offsets: Record<string, number> = {};

  let cumLeft = 0;
  for (const col of columns) {
    if (getPinnedSide(col.pinned) === 'left') {
      offsets[col.id] = cumLeft;
      cumLeft += parsePx(col.size);
    }
  }

  let cumRight = 0;
  for (const col of [...columns].reverse()) {
    if (getPinnedSide(col.pinned) === 'right') {
      offsets[col.id] = cumRight;
      cumRight += parsePx(col.size);
    }
  }

  return offsets;
}

function getColumnSizeStyle<T>(
  column: DataTableColumn<T>,
): CSSProperties | undefined {
  if (column.size === undefined) return undefined;

  const resolvedSize =
    typeof column.size === 'number' ? `${column.size}px` : column.size;

  return {
    width: resolvedSize,
    minWidth: resolvedSize,
    maxWidth: resolvedSize,
  };
}

function getCellContent(content: ReactNode, hasSize: boolean): ReactNode {
  if (!hasSize) return content;
  return (
    <div className="overflow-hidden text-ellipsis whitespace-nowrap">
      {content}
    </div>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: SortDirection;
}) {
  return (
    <span className="flex flex-col -space-y-1.5 ml-0.5">
      <ChevronUpIcon
        className={`h-3 w-3 transition-colors ${
          active && direction === 'asc'
            ? 'text-primary-500'
            : 'text-ink-ghost group-hover:text-ink-faint'
        }`}
      />
      <ChevronDownIcon
        className={`h-3 w-3 transition-colors ${
          active && direction === 'desc'
            ? 'text-primary-500'
            : 'text-ink-ghost group-hover:text-ink-faint'
        }`}
      />
    </span>
  );
}

function getPinnedClasses(
  pinned: DataTableColumn<unknown>['pinned'],
  isHeader: boolean,
): string {
  const side = getPinnedSide(pinned);
  if (!side) return '';
  const bg = isHeader ? 'bg-surface-raised' : 'bg-surface';
  if (side === 'left') {
    return `sticky z-10 ${bg} after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-edge`;
  }
  return `sticky z-10 ${bg} after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-edge`;
}

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'No records available.',
  sortState,
  onSortChange,
  onRowClick,
  footer,
}: DataTableProps<T>) {
  const { isRTL } = useLocale();
  const pinOffsets = buildPinOffsets(columns);

  const getAlignClass = (align: 'left' | 'center' | 'right') => {
    if (!isRTL) return alignClasses[align];
    // Swap left and right for RTL
    if (align === 'left') return alignClasses.right;
    if (align === 'right') return alignClasses.left;
    return alignClasses[align];
  };

  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable || !onSortChange) return;

    const sameColumn = sortState?.key === columnId;

    if (sameColumn && sortState?.direction === 'desc') {
      onSortChange(null);
      return;
    }

    const nextDirection: SortDirection =
      sameColumn && sortState?.direction === 'asc' ? 'desc' : 'asc';

    onSortChange({ key: columnId, direction: nextDirection });
  };

  return (
    <div className="overflow-x-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <table className="min-w-full divide-y divide-edge">
        <thead className="bg-surface-raised">
          <tr>
            {columns.map((column) => {
              const isSorted = sortState?.key === column.id;
              const align = column.align || 'left';
              const sizeStyle = getColumnSizeStyle(column);
              const side = getPinnedSide(column.pinned);
              const rtlSide =
                isRTL && side ? (side === 'left' ? 'right' : 'left') : side;
              const pinnedClasses = getPinnedClasses(column.pinned, true);
              const pinnedStyle: CSSProperties =
                rtlSide === 'left'
                  ? { left: pinOffsets[column.id] }
                  : rtlSide === 'right'
                    ? { right: pinOffsets[column.id] }
                    : {};

              return (
                <th
                  key={column.id}
                  scope="col"
                  style={{ ...sizeStyle, ...pinnedStyle }}
                  className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${getAlignClass(align)} ${isSorted ? 'text-primary-700 dark:text-primary-400' : 'text-ink-dim'} ${pinnedClasses} ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.id, column.sortable)}
                      className="group flex items-center justify-between w-full hover:text-ink transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {column.header}
                      <SortIcon
                        active={isSorted}
                        direction={sortState?.direction}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="bg-surface divide-y divide-edge">
          {rows.length ? (
            rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={`hover:bg-surface-raised transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => {
                  const align = column.align || 'left';
                  const sizeStyle = getColumnSizeStyle(column);
                  const side = getPinnedSide(column.pinned);
                  const rtlSide =
                    isRTL && side ? (side === 'left' ? 'right' : 'left') : side;
                  const pinnedClasses = getPinnedClasses(column.pinned, false);
                  const pinnedStyle: CSSProperties =
                    rtlSide === 'left'
                      ? { left: pinOffsets[column.id] }
                      : rtlSide === 'right'
                        ? { right: pinOffsets[column.id] }
                        : {};

                  return (
                    <td
                      key={`${getRowId(row)}-${column.id}`}
                      style={{ ...sizeStyle, ...pinnedStyle }}
                      className={`px-6 py-4 text-sm ${getAlignClass(align)} ${pinnedClasses} ${column.className || ''}`}
                      onClick={
                        column.id === 'actions' || column.id === 'checkbox'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {getCellContent(column.render(row), !!column.size)}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <BugAntIcon className="h-10 w-10 text-ink-faint" />
                  <p className="text-sm text-ink-faint">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        {footer && (
          <tfoot>
            <td colSpan={columns.length}>{footer}</td>
          </tfoot>
        )}
      </table>
    </div>
  );
}
