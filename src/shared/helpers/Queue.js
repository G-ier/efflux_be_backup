class Queue {
  constructor(maxSize = 3) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  push(item) {
    console.log(`Queue: ${this.queue.length}`);
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
