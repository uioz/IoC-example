import "express-serve-static-core";
import { AwilixContainer } from "awilix";

declare module 'express-serve-static-core' {
  interface Request {
    container?: AwilixContainer
  }
}