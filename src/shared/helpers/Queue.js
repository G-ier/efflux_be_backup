
const { PostbackLogger } = require('../../shared/lib/WinstonLogger');

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

class PostbackQueue extends Queue{
  constructor(maxSize){
    super(maxSize);
  }

  async processQueue(db){
    if (this.size() === this.maxSize) {
      try {
        const batch = [];
        const seenEventIds = new Set();
  
        // Build the batch, while filtering out duplicates based on event_id
        while(batch.length < this.maxSize && this.size() > 0) {
          const item = this.pop();
          if(!seenEventIds.has(item.event_id)) {
            seenEventIds.add(item.event_id);
            batch.push(item);
          }
        }
  
        // Perform the upsert
        await db.upsert('postback_events', batch, 'event_id');
        PostbackLogger.info(`Bulk Upserted: ${batch.length} items`);
  
      } catch (error) {
  
        PostbackLogger.error(`Error processing queue batch: ${error.message}`);
  
        // When encountering an error, remove duplicates and re-upsert.
        if (error.message.includes("ON CONFLICT DO UPDATE command cannot affect row a second time")) {
          // Filter batch to remove duplicates based on event_id
          const uniqueBatch = batch.filter((item, index, self) =>
            index === self.findIndex((i) => i.event_id === item.event_id)
          );
  
          // Re-attempt the upsert with the filtered batch
          await db.upsert('postback_events', uniqueBatch, 'event_id');
          PostbackLogger.info(`Re-upserted after removing duplicates: ${uniqueBatch.length} items`);
        }
      }
    }
  }
}

module.exports = {Queue, PostbackQueue};
