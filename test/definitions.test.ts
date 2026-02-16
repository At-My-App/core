// @ts-nocheck

import { AmaEvent, AmaEventDef } from "../src/definitions/AmaEvent";
import {
  AmaCustomEvent,
  AmaCustomEventDef,
} from "../src/definitions/AmaCustomEvent";
import {
  AmaComponentDef,
  AmaMdxConfigDef,
  AmaMdxFieldDef,
} from "../src/definitions/AmaMdx";

describe("Type Definitions", () => {
  describe("AmaEvent", () => {
    it("should create a valid AmaEventDef", () => {
      const pageViewEventDef: AmaEventDef<"page_view"> = {
        id: "page_view",
        type: "basic_event",
        __is_ATMYAPP_Object: true,
      };

      expect(pageViewEventDef.id).toBe("page_view");
      expect(pageViewEventDef.type).toBe("basic_event");
      expect(pageViewEventDef.__is_ATMYAPP_Object).toBe(true);
    });

    it("should create a valid AmaEvent", () => {
      const pageViewEventDef: AmaEventDef<"page_view"> = {
        id: "page_view",
        type: "basic_event",
        __is_ATMYAPP_Object: true,
      };

      const pageViewEvent: AmaEvent<"page_view"> = {
        ref: pageViewEventDef,
        data: {
          timestamp: "2023-01-01T00:00:00Z",
          user_agent: "Mozilla/5.0...",
        },
      };

      expect(pageViewEvent.ref.id).toBe("page_view");
      expect(pageViewEvent.data.timestamp).toBe("2023-01-01T00:00:00Z");
    });

    it("should enforce string ID type", () => {
      // This should compile without errors
      const userLoginEventDef: AmaEventDef<"user_login"> = {
        id: "user_login",
        type: "basic_event",
        __is_ATMYAPP_Object: true,
      };

      expect(userLoginEventDef.id).toBe("user_login");
    });

    it("should work with different event IDs", () => {
      const buttonClickEventDef: AmaEventDef<"button_click"> = {
        id: "button_click",
        type: "basic_event",
        __is_ATMYAPP_Object: true,
      };

      const formSubmitEventDef: AmaEventDef<"form_submit"> = {
        id: "form_submit",
        type: "basic_event",
        __is_ATMYAPP_Object: true,
      };

      expect(buttonClickEventDef.id).toBe("button_click");
      expect(formSubmitEventDef.id).toBe("form_submit");
    });
  });

  describe("AmaCustomEvent", () => {
    it("should create a valid AmaCustomEventDef", () => {
      const purchaseEventDef: AmaCustomEventDef<
        "purchase",
        ["user_id", "product_id", "amount"]
      > = {
        id: "purchase",
        columns: ["user_id", "product_id", "amount"],
        type: "event",
        __is_ATMYAPP_Object: true,
      };

      expect(purchaseEventDef.id).toBe("purchase");
      expect(purchaseEventDef.columns).toEqual([
        "user_id",
        "product_id",
        "amount",
      ]);
      expect(purchaseEventDef.type).toBe("event");
    });

    it("should create a valid AmaCustomEvent", () => {
      const purchaseEventDef: AmaCustomEventDef<
        "purchase",
        ["user_id", "product_id", "amount"]
      > = {
        id: "purchase",
        columns: ["user_id", "product_id", "amount"],
        type: "event",
        __is_ATMYAPP_Object: true,
      };

      const purchaseEvent: AmaCustomEvent<
        "purchase",
        ["user_id", "product_id", "amount"]
      > = {
        ref: purchaseEventDef,
        data: {
          user_id: "12345",
          product_id: "abc123",
          amount: "99.99",
        },
      };

      expect(purchaseEvent.ref.id).toBe("purchase");
      expect(purchaseEvent.data.user_id).toBe("12345");
      expect(purchaseEvent.data.product_id).toBe("abc123");
      expect(purchaseEvent.data.amount).toBe("99.99");
    });
  });

  describe("Type Differences", () => {
    it("should distinguish between basic and custom events", () => {
      const basicEvent: AmaEventDef<"page_view"> = {
        id: "page_view",
        type: "basic_event",
        __is_ATMYAPP_Object: true,
      };

      const customEvent: AmaCustomEventDef<"purchase", ["user_id"]> = {
        id: "purchase",
        columns: ["user_id"],
        type: "event",
        __is_ATMYAPP_Object: true,
      };

      expect(basicEvent.type).toBe("basic_event");
      expect(customEvent.type).toBe("event");
      expect("columns" in basicEvent).toBe(false);
      expect("columns" in customEvent).toBe(true);
    });

    it("should handle basic event data as Record<string, string>", () => {
      const basicEventData: AmaEvent<"page_view">["data"] = {
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0...",
        referrer: "https://google.com",
      };

      expect(typeof basicEventData.ip_address).toBe("string");
      expect(typeof basicEventData.user_agent).toBe("string");
      expect(typeof basicEventData.referrer).toBe("string");
    });

    it("should handle custom event data with typed columns", () => {
      type PurchaseEvent = AmaCustomEvent<
        "purchase",
        ["user_id", "product_id"]
      >;

      const customEventData: PurchaseEvent["data"] = {
        user_id: "12345",
        product_id: "abc123",
      };

      // These should be the only allowed keys based on the columns type
      expect(customEventData.user_id).toBe("12345");
      expect(customEventData.product_id).toBe("abc123");
    });
  });

  describe("AmaMdx", () => {
    it("should define mdx configs and fields", () => {
      type Callout = AmaComponentDef<
        "Callout",
        { title: string; count: number }
      >;
      type BlogMdxConfig = AmaMdxConfigDef<"blogComponents", [Callout]>;
      type BlogRow = { body: AmaMdxFieldDef<BlogMdxConfig> };

      const field: BlogRow["body"] = {
        __amatype: "AmaMdxDef",
        mdxConfig: "blogComponents",
      };

      expect(field.__amatype).toBe("AmaMdxDef");
      expect(field.mdxConfig).toBe("blogComponents");
    });
  });
});
