import { User } from '../entities/user.entity';
import { Express, Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    // Add req.user interface to express
    interface User {
      id: string;
      email: string;
      role?: string;
    }

    interface Request {
      currentUser?: User;
    }
  }
}

// Fix the return type for request handlers 
declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: Express.User;
  }

  // Allow any return type for RequestHandler
  interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): void | Response | Promise<void | Response>;
  }

  // Fix router.use() typing to accept our middleware
  interface IRouter {
    use: RouterUse<this>;
  }

  interface RouterUse<T> {
    (handler: RequestHandler | ErrorRequestHandler): T;
    (path: PathParams, ...handlers: Array<RequestHandler | ErrorRequestHandler>): T;
  }

  // Fix router.METHOD() typing
  interface IRouterMatcher<T> {
    <P = ParamsDictionary, ResBody = any, ReqBody = any>(
      path: PathParams,
      ...handlers: Array<RequestHandlerParams<P, ResBody, ReqBody>>
    ): T;
  }

  interface IRouterHandler<T> {
    (...handlers: RequestHandler[]): T;
  }
} 