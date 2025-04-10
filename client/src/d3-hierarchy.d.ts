declare module 'd3-hierarchy' {
  export interface HierarchyNode<T> {
    data: T;
    depth: number;
    height: number;
    parent: HierarchyNode<T> | null;
    children?: Array<HierarchyNode<T>>;
    value?: number;
    x?: number;
    y?: number;
  }

  export function hierarchy<T>(
    data: T,
    children?: (d: T) => Iterable<T> | null | undefined
  ): HierarchyNode<T>;

  export interface TreeLayout<T> {
    (root: HierarchyNode<T>): HierarchyNode<T>;
    size(): [number, number];
    size(size: [number, number]): this;
    nodeSize(): [number, number];
    nodeSize(size: [number, number]): this;
    separation(): (a: HierarchyNode<T>, b: HierarchyNode<T>) => number;
    separation(separation: (a: HierarchyNode<T>, b: HierarchyNode<T>) => number): this;
  }

  export function tree<T>(): TreeLayout<T>;
}