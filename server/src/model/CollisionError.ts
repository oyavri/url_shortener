export class CollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollisionError";
  }
}
