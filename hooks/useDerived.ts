import { useMemo } from "react";

/**
 * Memoize a derived value computed from store state or props.
 *
 * Wraps useMemo with the correct dependency array — use this when deriving
 * filtered/sorted arrays from store selectors so the computation only runs
 * when the source data actually changes.
 *
 * @example
 * const persons = useDerived(objects, (o) => o.filter((x) => x.type === "person"));
 */
export function useDerived<T, R>(value: T, derive: (value: T) => R): R {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => derive(value), [value]);
}
