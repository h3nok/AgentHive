declare module '*.worker.ts' {
  // You need to change here if using a different loader
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}

// Support for importing workers with URL constructor
declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
} 