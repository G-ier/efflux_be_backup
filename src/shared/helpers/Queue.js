class Queue {
  constructor(maxSize = 90) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  push(item) {
    if (this.queue.length < this.maxSize) {
      this.queue.push(item);
      return true;
    }
    return false;
  }

  pop() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }
}

module.exports = Queue;
