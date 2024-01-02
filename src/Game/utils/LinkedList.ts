class ListElem<T> {
  data: T;
  next: ListElem<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList<T> {
  head: ListElem<T> | null;
  tail: ListElem<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  isEmpty(): boolean {
    return this.head === null;
  }

  append(data: T): void {
    const newListElem = new ListElem(data);
    if (this.isEmpty()) {
      this.head = newListElem;
      this.tail = newListElem;
    } else {
      this.tail!.next = newListElem;
      this.tail = newListElem;
    }
  }

  prepend(data: T): void {
    const newListElem = new ListElem(data);
    if (this.isEmpty()) {
      this.head = newListElem;
      this.tail = newListElem;
    } else {
      newListElem.next = this.head;
      this.head = newListElem;
    }
  }

  delete(data: T): void {
    if (this.isEmpty()) {
      return;
    }

    if (this.head!.data === data) {
      this.head = this.head!.next;
      if (!this.head) {
        this.tail = null;
      }
      return;
    }

    let current = this.head;
    while (current!.next !== null) {
      if (current!.next.data === data) {
        current!.next = current!.next.next;
        if (current!.next === null) {
          this.tail = current;
        }
        return;
      }
      current = current!.next;
    }
  }

  print(): void {
    let current = this.head;
    const values: T[] = [];
    while (current !== null) {
      values.push(current.data);
      current = current.next;
    }
    console.error(values.join(" -> "));
  }
}
