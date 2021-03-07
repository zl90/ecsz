interface Ctor<T> {
    new (...args: any[]): T;
}

interface Poolable {
    _pool: ObjectPool<any> | undefined;
    reset: () => void;
}

export class ObjectPool<C extends Poolable> {
    public freeList: C[] = [];
    public count: number = 0;
    public ctor: Ctor<C>;
    public isObjectPool = true;

    // @todo Add initial size
    public constructor(ctor: Ctor<C>, initialSize?: number) {
        this.ctor = ctor;
        if (typeof initialSize !== "undefined") {
            this.expand(initialSize);
        }
    }

    public acquire(): C {
        // Grow the list by 20%ish if we're out
        if (this.freeList.length <= 0) {
            this.expand(Math.round(this.count * 0.2) + 1);
        }

        var item = this.freeList.pop();
        return item as C;
    }

    public release(item: C): void {
        item.reset();
        this.freeList.push(item);
    }

    public expand(count: number): void {
        for (var n = 0; n < count; n++) {
            var clone = new this.ctor();
            clone._pool = this;
            this.freeList.push(clone);
        }
        this.count += count;
    }

    public totalSize(): number {
        return this.count;
    }

    public totalFree(): number {
        return this.freeList.length;
    }

    public totalUsed(): number {
        return this.count - this.freeList.length;
    }
}
