/**
 * Simple dependency injection container
 */
export interface DIContainer {
  resolve(name: string): any;
  register(name: string, instance: any): void;
}

class SimpleDIContainer implements DIContainer {
  private container: Map<string, any> = new Map();

  /**
   * Register a service in the container
   * @param name The name of the service
   * @param instance The service instance
   */
  register(name: string, instance: any): void {
    this.container.set(name, instance);
  }

  /**
   * Get a service from the container
   * @param name The name of the service
   * @returns The service instance
   */
  resolve(name: string): any {
    if (!this.container.has(name)) {
      throw new Error(`Dependency ${name} not found in container`);
    }
    return this.container.get(name);
  }
}

export const diContainer = new SimpleDIContainer(); 