export class DomainError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {}
