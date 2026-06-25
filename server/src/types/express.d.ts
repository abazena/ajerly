import { HydratedDocument } from "mongoose";
import { IOffice } from "../models/Office";
import { IUser } from "../models/User";
import { IOperator } from "../models/Operator";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: HydratedDocument<IUser>;
      office?: HydratedDocument<IOffice>;
      operator?: HydratedDocument<IOperator>;
    }
  }
}

export {};
