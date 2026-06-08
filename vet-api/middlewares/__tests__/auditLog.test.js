import { describe, it, expect, jest, beforeAll, beforeEach } from "@jest/globals";

const recordAuditMock = jest.fn();

jest.unstable_mockModule("../../services/audit/recordAudit.js", () => ({
  recordAudit: recordAuditMock,
}));

let auditLog;

beforeAll(async () => {
  ({ default: auditLog } = await import("../auditLog.js"));
});

beforeEach(() => {
  recordAuditMock.mockClear();
});

// Ελαφρύ mock του Express response: αποθηκεύει τον "finish" listener
// και μας αφήνει να τον πυροδοτήσουμε χειροκίνητα μετά τον ορισμό του statusCode.
const buildRes = (statusCode) => {
  const listeners = {};
  return {
    statusCode,
    on: jest.fn((event, cb) => {
      listeners[event] = cb;
    }),
    triggerFinish() {
      listeners.finish?.();
    },
  };
};

const buildReq = (overrides = {}) => ({
  method: "POST",
  baseUrl: "/api/customers",
  originalUrl: "/api/customers",
  params: {},
  user: { userId: "u1", name: "Δρ. Παπαδάκη", role: "admin" },
  requestId: "req-123",
  ip: "127.0.0.1",
  ...overrides,
});

describe("auditLog middleware", () => {
  it("calls next() synchronously regardless of the eventual outcome", () => {
    const next = jest.fn();

    auditLog(buildReq(), buildRes(201), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("records a CREATE entry once the response finishes successfully", () => {
    const req = buildReq({ method: "POST", originalUrl: "/api/customers", baseUrl: "/api/customers" });
    const res = buildRes(201);

    auditLog(req, res, jest.fn());
    res.triggerFinish();

    expect(recordAuditMock).toHaveBeenCalledTimes(1);
    expect(recordAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        resource: "customers",
        statusCode: 201,
        userId: "u1",
        userName: "Δρ. Παπαδάκη",
        userRole: "admin",
        requestId: "req-123",
      })
    );
  });

  it.each([
    ["PUT", "UPDATE"],
    ["PATCH", "UPDATE"],
    ["DELETE", "DELETE"],
  ])("maps HTTP %s to action %s", (method, expectedAction) => {
    const req = buildReq({ method, originalUrl: "/api/appointments/abc123", baseUrl: "/api/appointments", params: { id: "abc123" } });
    const res = buildRes(200);

    auditLog(req, res, jest.fn());
    res.triggerFinish();

    expect(recordAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: expectedAction, resource: "appointments", resourceId: "abc123" })
    );
  });

  it("does not record anything for read-only GET requests", () => {
    const req = buildReq({ method: "GET", originalUrl: "/api/customers" });
    const res = buildRes(200);

    auditLog(req, res, jest.fn());
    res.triggerFinish();

    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("does not record failed mutations (4xx/5xx responses)", () => {
    const req = buildReq({ method: "POST", originalUrl: "/api/customers" });
    const res = buildRes(400);

    auditLog(req, res, jest.fn());
    res.triggerFinish();

    expect(recordAuditMock).not.toHaveBeenCalled();
  });
});
