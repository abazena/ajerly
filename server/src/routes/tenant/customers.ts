import { Router } from "express";
import { Types } from "mongoose";
import { Customer } from "../../models/Customer";
import { validate } from "../../middleware/validate";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuery,
} from "../../validators/customers";
import { idParam } from "../../validators/common";
import { withTenant, tenantId } from "../../lib/withTenant";
import { NotFound } from "../../lib/errors";
import { customerStatement } from "../../services/customers/statement";

export const tenantCustomersRouter = Router();

tenantCustomersRouter.get(
  "/customers",
  validate(listCustomersQuery, "query"),
  async (req, res, next) => {
    try {
      const { kind } = req.query as unknown as import("zod").infer<typeof listCustomersQuery>;
      const filter = { ...withTenant(req), ...(kind ? { kind } : {}) };
      const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
      res.json({
        customers: customers.map((c) => ({
          ...c,
          _id: String(c._id),
          tenantId: String(c.tenantId),
        })),
      });
    } catch (e) {
      next(e);
    }
  },
);

tenantCustomersRouter.post("/customers", validate(createCustomerSchema), async (req, res, next) => {
  try {
    const body = req.body as import("zod").infer<typeof createCustomerSchema>;
    const customer = await Customer.create({ ...body, tenantId: tenantId(req), balance: 0 });
    res.status(201).json(customer.toObject());
  } catch (e) {
    next(e);
  }
});

tenantCustomersRouter.get(
  "/customers/:id",
  validate(idParam, "params"),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as { id: string };
      const customer = await Customer.findOne({ _id: id, ...withTenant(req) }).lean();
      if (!customer) throw NotFound("CUSTOMER_NOT_FOUND");
      res.json({ ...customer, _id: String(customer._id) });
    } catch (e) {
      next(e);
    }
  },
);

tenantCustomersRouter.patch(
  "/customers/:id",
  validate(idParam, "params"),
  validate(updateCustomerSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as { id: string };
      const body = req.body as import("zod").infer<typeof updateCustomerSchema>;
      const updated = await Customer.findOneAndUpdate(
        { _id: id, ...withTenant(req) },
        { $set: body },
        { new: true },
      );
      if (!updated) throw NotFound("CUSTOMER_NOT_FOUND");
      res.json(updated.toObject());
    } catch (e) {
      next(e);
    }
  },
);

tenantCustomersRouter.get(
  "/customers/:id/statement",
  validate(idParam, "params"),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as { id: string };
      const customer = await Customer.findOne({ _id: id, ...withTenant(req) }).lean();
      if (!customer) throw NotFound("CUSTOMER_NOT_FOUND");
      const rows = await customerStatement(tenantId(req), customer._id as Types.ObjectId);
      res.json({
        customer: { _id: String(customer._id), name: customer.name, balance: customer.balance },
        rows,
      });
    } catch (e) {
      next(e);
    }
  },
);
