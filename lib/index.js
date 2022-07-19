"use strict";
// To parse this data:
//
//   import { Convert, Refund, WcOrder } from "./file";
//
//   const refund = Convert.toRefund(json);
//   const wcOrder = Convert.toWcOrder(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Convert = exports.TaxClass = exports.Key = void 0;
var Key;
(function (Key) {
    Key["Items"] = "Items";
    Key["RefundedItemID"] = "_refunded_item_id";
    Key["SmartSendAutoGenerateReturnLabel"] = "smart_send_auto_generate_return_label";
    Key["SmartSendReturnMethod"] = "smart_send_return_method";
    Key["SmartSendShippingMethod"] = "smart_send_shipping_method";
})(Key = exports.Key || (exports.Key = {}));
var TaxClass;
(function (TaxClass) {
    TaxClass["Empty"] = "";
    TaxClass["ReducedRate"] = "reduced-rate";
    TaxClass["NormalRate"] = "normal-rate";
})(TaxClass = exports.TaxClass || (exports.TaxClass = {}));
// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
class Convert {
    static toRefund(json) {
        return cast(JSON.parse(json), r("Refund"));
    }
    static refundToJson(value) {
        return JSON.stringify(uncast(value, r("Refund")), null, 2);
    }
    static toWcOrder(json) {
        return cast(JSON.parse(json), r("WcOrder"));
    }
    static wcOrderToJson(value) {
        return JSON.stringify(uncast(value, r("WcOrder")), null, 2);
    }
}
exports.Convert = Convert;
function invalidValue(typ, val, key = '') {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}
function jsonToJSProps(typ) {
    if (typ.jsonToJS === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}
function jsToJSONProps(typ) {
    if (typ.jsToJSON === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}
function transform(val, typ, getProps, key = '') {
    function transformPrimitive(typ, val) {
        if (typeof typ === typeof val)
            return val;
        return invalidValue(typ, val, key);
    }
    function transformUnion(typs, val) {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            }
            catch (_) { }
        }
        return invalidValue(typs, val);
    }
    function transformEnum(cases, val) {
        if (cases.indexOf(val) !== -1)
            return val;
        return invalidValue(cases, val);
    }
    function transformArray(typ, val) {
        // val must be an array with no invalid elements
        if (!Array.isArray(val))
            return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }
    function transformDate(val) {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }
    function transformObject(props, additional, val) {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }
    if (typ === "any")
        return val;
    if (typ === null) {
        if (val === null)
            return val;
        return invalidValue(typ, val);
    }
    if (typ === false)
        return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ))
        return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number")
        return transformDate(val);
    return transformPrimitive(typ, val);
}
function cast(val, typ) {
    return transform(val, typ, jsonToJSProps);
}
function uncast(val, typ) {
    return transform(val, typ, jsToJSONProps);
}
function a(typ) {
    return { arrayItems: typ };
}
function u(...typs) {
    return { unionMembers: typs };
}
function o(props, additional) {
    return { props, additional };
}
function m(additional) {
    return { props: [], additional };
}
function r(name) {
    return { ref: name };
}
const typeMap = {
    "Refund": o([
        { json: "id", js: "id", typ: 0 },
        { json: "date_created", js: "date_created", typ: Date },
        { json: "date_created_gmt", js: "date_created_gmt", typ: Date },
        { json: "amount", js: "amount", typ: "" },
        { json: "reason", js: "reason", typ: "" },
        { json: "refunded_by", js: "refunded_by", typ: 0 },
        { json: "refunded_payment", js: "refunded_payment", typ: u(undefined, true) },
        { json: "meta_data", js: "meta_data", typ: a(r("RefundMetaData")) },
        { json: "line_items", js: "line_items", typ: a(r("RefundLineItem")) },
        { json: "shipping_lines", js: "shipping_lines", typ: u(undefined, a("any")) },
        { json: "tax_lines", js: "tax_lines", typ: u(undefined, a(r("RefundTaxLine"))) },
        { json: "fee_lines", js: "fee_lines", typ: u(undefined, a("any")) },
        { json: "_links", js: "_links", typ: u(undefined, r("RefundLinks")) },
    ], false),
    "RefundLinks": o([
        { json: "self", js: "self", typ: a(r("Collection")) },
        { json: "collection", js: "collection", typ: a(r("Collection")) },
        { json: "up", js: "up", typ: a(r("Collection")) },
    ], false),
    "Collection": o([
        { json: "href", js: "href", typ: "" },
    ], false),
    "RefundLineItem": o([
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "product_id", js: "product_id", typ: 0 },
        { json: "variation_id", js: "variation_id", typ: 0 },
        { json: "quantity", js: "quantity", typ: 0 },
        { json: "tax_class", js: "tax_class", typ: "" /* r("TaxClass") */ },
        { json: "subtotal", js: "subtotal", typ: "" },
        { json: "subtotal_tax", js: "subtotal_tax", typ: "" },
        { json: "total", js: "total", typ: "" },
        { json: "total_tax", js: "total_tax", typ: "" },
        { json: "taxes", js: "taxes", typ: a(r("Tax")) },
        { json: "meta_data", js: "meta_data", typ: a(r("ShippingLineMetaData")) },
        { json: "sku", js: "sku", typ: "" },
        { json: "price", js: "price", typ: 0 },
        { json: "parent_name", js: "parent_name", typ: u(null, u(undefined, "")) },
    ], false),
    "ShippingLineMetaData": o([
        { json: "id", js: "id", typ: 0 },
        { json: "key", js: "key", typ: r("Key") },
        { json: "value", js: "value", typ: "" },
        { json: "display_key", js: "display_key", typ: r("Key") },
        { json: "display_value", js: "display_value", typ: "any" },
    ], false),
    "Tax": o([
        { json: "id", js: "id", typ: 0 },
        { json: "total", js: "total", typ: "" },
        { json: "subtotal", js: "subtotal", typ: "" },
    ], false),
    "RefundMetaData": o([
        { json: "id", js: "id", typ: 0 },
        { json: "key", js: "key", typ: "" },
        { json: "value", js: "value", typ: u(r("PurpleValue"), "") },
    ], false),
    "PurpleValue": o([
        { json: "orders_count", js: "orders_count", typ: u(undefined, 0) },
        { json: "avg_order_value", js: "avg_order_value", typ: u(undefined, 3.14) },
        { json: "ltv", js: "ltv", typ: u(undefined, 3.14) },
    ], false),
    "RefundTaxLine": o([
        { json: "id", js: "id", typ: 0 },
        { json: "rate_code", js: "rate_code", typ: "" },
        { json: "rate_id", js: "rate_id", typ: 0 },
        { json: "label", js: "label", typ: "" },
        { json: "compound", js: "compound", typ: true },
        { json: "tax_total", js: "tax_total", typ: "" },
        { json: "shipping_tax_total", js: "shipping_tax_total", typ: "" },
        { json: "rate_percent", js: "rate_percent", typ: 0 },
        { json: "meta_data", js: "meta_data", typ: a("any") },
    ], false),
    "WcOrder": o([
        { json: "id", js: "id", typ: u(0, "") },
        { json: "parent_id", js: "parent_id", typ: 0 },
        { json: "number", js: "number", typ: "" },
        { json: "order_key", js: "order_key", typ: "" },
        { json: "created_via", js: "created_via", typ: "" },
        { json: "version", js: "version", typ: "" },
        { json: "status", js: "status", typ: "" },
        { json: "currency", js: "currency", typ: "" },
        { json: "date_created", js: "date_created", typ: Date },
        { json: "date_created_gmt", js: "date_created_gmt", typ: Date },
        { json: "date_modified", js: "date_modified", typ: Date },
        { json: "date_modified_gmt", js: "date_modified_gmt", typ: Date },
        { json: "discount_total", js: "discount_total", typ: u(0, "") },
        { json: "discount_tax", js: "discount_tax", typ: u(0, "") },
        { json: "shipping_total", js: "shipping_total", typ: u(0, "") },
        { json: "shipping_tax", js: "shipping_tax", typ: u(0, "") },
        { json: "cart_tax", js: "cart_tax", typ: u(3.14, "") },
        { json: "total", js: "total", typ: "" },
        { json: "total_tax", js: "total_tax", typ: "" },
        { json: "prices_include_tax", js: "prices_include_tax", typ: true },
        { json: "customer_id", js: "customer_id", typ: 0 },
        { json: "customer_ip_address", js: "customer_ip_address", typ: "" },
        { json: "customer_user_agent", js: "customer_user_agent", typ: "" },
        { json: "customer_note", js: "customer_note", typ: "" },
        { json: "billing", js: "billing", typ: r("Address") },
        { json: "shipping", js: "shipping", typ: r("Address") },
        { json: "payment_method", js: "payment_method", typ: "" },
        { json: "payment_method_title", js: "payment_method_title", typ: "" },
        { json: "transaction_id", js: "transaction_id", typ: "" },
        { json: "date_paid", js: "date_paid", typ: Date },
        { json: "date_paid_gmt", js: "date_paid_gmt", typ: Date },
        { json: "date_completed", js: "date_completed", typ: u(undefined, Date) },
        { json: "date_completed_gmt", js: "date_completed_gmt", typ: u(undefined, Date) },
        { json: "cart_hash", js: "cart_hash", typ: "" },
        { json: "meta_data", js: "meta_data", typ: a(r("WcOrderMetaData")) },
        { json: "line_items", js: "line_items", typ: a(r("WcOrderLineItem")) },
        { json: "tax_lines", js: "tax_lines", typ: a(r("WcOrderTaxLine")) },
        { json: "shipping_lines", js: "shipping_lines", typ: a(r("ShippingLine")) },
        { json: "fee_lines", js: "fee_lines", typ: a("any") },
        { json: "coupon_lines", js: "coupon_lines", typ: a(r("CouponLine")) },
        { json: "refunds", js: "refunds", typ: a(r("RefundElement")) },
        { json: "payment_url", js: "payment_url", typ: u(undefined, "") },
        { json: "currency_symbol", js: "currency_symbol", typ: u(undefined, "") },
        { json: "_links", js: "_links", typ: u(undefined, r("WcOrderLinks")) },
        { json: "_wcpdf_document_link", js: "_wcpdf_document_link", typ: u(undefined, "") },
        { json: "_wc_order_key", js: "_wc_order_key", typ: u(undefined, "") },
    ], false),
    "WcOrderLinks": o([
        { json: "self", js: "self", typ: a(r("Collection")) },
        { json: "collection", js: "collection", typ: a(r("Collection")) },
        { json: "customer", js: "customer", typ: u(undefined, a(r("Collection"))) },
    ], false),
    "Address": o([
        { json: "first_name", js: "first_name", typ: "" },
        { json: "last_name", js: "last_name", typ: "" },
        { json: "company", js: "company", typ: "" },
        { json: "address_1", js: "address_1", typ: "" },
        { json: "address_2", js: "address_2", typ: "" },
        { json: "city", js: "city", typ: "" },
        { json: "state", js: "state", typ: "" },
        { json: "postcode", js: "postcode", typ: "" },
        { json: "country", js: "country", typ: "" },
        { json: "email", js: "email", typ: u(undefined, "") },
        { json: "phone", js: "phone", typ: u(undefined, "") },
    ], false),
    "CouponLine": o([
        { json: "id", js: "id", typ: 0 },
        { json: "code", js: "code", typ: "" },
        { json: "discount", js: "discount", typ: "" },
        { json: "discount_tax", js: "discount_tax", typ: "" },
        { json: "meta_data", js: "meta_data", typ: a("any") },
    ], false),
    "CouponLineMetaData": o([
        { json: "id", js: "id", typ: 0 },
        { json: "key", js: "key", typ: "" },
        { json: "value", js: "value", typ: r("MetaDataDisplayValueClass") },
        { json: "display_key", js: "display_key", typ: "" },
        { json: "display_value", js: "display_value", typ: "any" },
    ], false),
    "MetaDataDisplayValueClass": o([], false),
    "WcOrderLineItem": o([
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "product_id", js: "product_id", typ: 0 },
        { json: "variation_id", js: "variation_id", typ: 0 },
        { json: "quantity", js: "quantity", typ: 0 },
        { json: "tax_class", js: "tax_class", typ: "" /* r("TaxClass") */ },
        { json: "subtotal", js: "subtotal", typ: "" },
        { json: "subtotal_tax", js: "subtotal_tax", typ: "" },
        { json: "total", js: "total", typ: "" },
        { json: "total_tax", js: "total_tax", typ: "" },
        { json: "taxes", js: "taxes", typ: a(r("Tax")) },
        { json: "meta_data", js: "meta_data", typ: a(r("PurpleMetaData")) },
        { json: "sku", js: "sku", typ: "" },
        { json: "price", js: "price", typ: 3.14 },
        { json: "parent_name", js: "parent_name", typ: u(null, u(undefined, "")) },
        { json: "bundled_by", js: "bundled_by", typ: u(undefined, u(0, "")) },
        { json: "bundled_item_title", js: "bundled_item_title", typ: u(undefined, "") },
        { json: "bundled_items", js: "bundled_items", typ: u(undefined, a(0)) },
        { json: "composite_parent", js: "composite_parent", typ: u(undefined, "") },
        { json: "composite_children", js: "composite_children", typ: u(undefined, a("any")) },
    ], false),
    "PurpleMetaData": o([
        { json: "id", js: "id", typ: 0 },
        { json: "key", js: "key", typ: "" },
        { json: "value", js: "value", typ: u(a(""), m(r("DisplayValueValue")), "") },
        { json: "display_key", js: "display_key", typ: "" },
        { json: "display_value", js: "display_value", typ: u(a(""), m("any"), "") },
    ], false),
    "DisplayValueValue": o([
        { json: "product_id", js: "product_id", typ: 0 },
        { json: "quantity", js: "quantity", typ: 0 },
        { json: "discount", js: "discount", typ: "" },
    ], false),
    "WcOrderMetaData": o([
        { json: "id", js: "id", typ: 0 },
        { json: "key", js: "key", typ: "" },
        /*{ json: "value", js: "value", typ: u(a(r("ValueElement")), r("FluffyValue"), "") },*/
        { json: "value", js: "value", typ: "any" },
    ], false),
    "ValueElement": o([
        { json: "tracking_provider", js: "tracking_provider", typ: u(undefined, "") },
        { json: "custom_tracking_provider", js: "custom_tracking_provider", typ: u(undefined, "") },
        { json: "custom_tracking_link", js: "custom_tracking_link", typ: u(undefined, "") },
        { json: "tracking_number", js: "tracking_number", typ: u(undefined, "") },
        { json: "date_shipped", js: "date_shipped", typ: u(undefined, "") },
        { json: "tracking_id", js: "tracking_id", typ: u(undefined, "") },
    ], false),
    "FluffyValue": o([
        { json: "fbc", js: "fbc", typ: u(undefined, null) },
        { json: "fbp", js: "fbp", typ: u(undefined, u(null, "")) },
        { json: "zone_id", js: "zone_id", typ: u(undefined, "") },
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "countries", js: "countries", typ: u(undefined, a("")) },
        { json: "currency", js: "currency", typ: u(undefined, "") },
        { json: "exchange_rate", js: "exchange_rate", typ: u(undefined, "") },
        { json: "auto_exchange_rate", js: "auto_exchange_rate", typ: u(undefined, "") },
        { json: "exchange_rate_fee", js: "exchange_rate_fee", typ: u(undefined, 0) },
        { json: "round_nearest", js: "round_nearest", typ: u(undefined, "") },
        { json: "currency_format", js: "currency_format", typ: u(undefined, "") },
        { json: "price_thousand_sep", js: "price_thousand_sep", typ: u(undefined, "") },
        { json: "price_decimal_sep", js: "price_decimal_sep", typ: u(undefined, "") },
        { json: "price_num_decimals", js: "price_num_decimals", typ: u(undefined, 0) },
        { json: "disable_tax_adjustment", js: "disable_tax_adjustment", typ: u(undefined, "") },
        { json: "real_exchange_rate", js: "real_exchange_rate", typ: u(undefined, "") },
        { json: "round_after_taxes", js: "round_after_taxes", typ: u(undefined, "") },
        { json: "trim_zeros", js: "trim_zeros", typ: u(undefined, "") },
        { json: "pys_landing", js: "pys_landing", typ: u(undefined, "") },
        { json: "pys_source", js: "pys_source", typ: u(undefined, "") },
        { json: "pys_utm", js: "pys_utm", typ: u(undefined, "") },
        { json: "pys_browser_time", js: "pys_browser_time", typ: u(undefined, "") },
        { json: "orders_count", js: "orders_count", typ: u(undefined, 0) },
        { json: "avg_order_value", js: "avg_order_value", typ: u(undefined, 3.14) },
        { json: "ltv", js: "ltv", typ: u(undefined, 3.14) },
        { json: "header_logo", js: "header_logo", typ: u(undefined, "") },
        { json: "header_logo_height", js: "header_logo_height", typ: u(undefined, "") },
        { json: "shop_name", js: "shop_name", typ: u(undefined, r("Extra1")) },
        { json: "shop_address", js: "shop_address", typ: u(undefined, r("Extra1")) },
        { json: "footer", js: "footer", typ: u(undefined, r("Extra1")) },
        { json: "extra_1", js: "extra_1", typ: u(undefined, r("Extra1")) },
        { json: "extra_2", js: "extra_2", typ: u(undefined, r("Extra1")) },
        { json: "extra_3", js: "extra_3", typ: u(undefined, r("Extra1")) },
        { json: "number", js: "number", typ: u(undefined, 0) },
        { json: "formatted_number", js: "formatted_number", typ: u(undefined, "") },
        { json: "prefix", js: "prefix", typ: u(undefined, "") },
        { json: "suffix", js: "suffix", typ: u(undefined, "") },
        { json: "document_type", js: "document_type", typ: u(undefined, "") },
        { json: "order_id", js: "order_id", typ: u(undefined, 0) },
        { json: "padding", js: "padding", typ: u(undefined, "") },
    ], false),
    "Extra1": o([
        { json: "default", js: "default", typ: "" },
    ], false),
    "RefundElement": o([
        { json: "id", js: "id", typ: 0 },
        { json: "reason", js: "reason", typ: "" },
        { json: "total", js: "total", typ: "" },
    ], false),
    "ShippingLine": o([
        { json: "id", js: "id", typ: 0 },
        { json: "method_title", js: "method_title", typ: "" },
        { json: "method_id", js: "method_id", typ: "" },
        { json: "instance_id", js: "instance_id", typ: "" },
        { json: "total", js: "total", typ: "" },
        { json: "total_tax", js: "total_tax", typ: "" },
        { json: "taxes", js: "taxes", typ: a(r("Tax")) },
        { json: "meta_data", js: "meta_data", typ: a(r("ShippingLineMetaData")) },
    ], false),
    "WcOrderTaxLine": o([
        { json: "id", js: "id", typ: u(0, "") },
        { json: "rate_code", js: "rate_code", typ: "" },
        { json: "rate_id", js: "rate_id", typ: u(0, "") },
        { json: "label", js: "label", typ: "" },
        { json: "compound", js: "compound", typ: true },
        { json: "tax_total", js: "tax_total", typ: u(3.14, "") },
        { json: "shipping_tax_total", js: "shipping_tax_total", typ: u(0, "") },
        { json: "meta_data", js: "meta_data", typ: a("any") },
        { json: "rate_percent", js: "rate_percent", typ: u(undefined, 3.14) },
    ], false),
    "Key": [
        "Items",
        "_refunded_item_id",
        "smart_send_auto_generate_return_label",
        "smart_send_return_method",
        "smart_send_shipping_method",
    ],
    "TaxClass": [
        "",
        "normal-rate",
        "reduced-rate",
    ],
};
