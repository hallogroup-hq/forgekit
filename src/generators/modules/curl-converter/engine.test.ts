import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseCurl,
  generateFetchCode,
  generateAxiosCode,
  generatePythonRequestsCode,
  generateGoHttpCode,
} from "./engine";

describe("cURL to Code Converter Engine", () => {
  describe("parseCurl", () => {
    it("should parse simple GET command", () => {
      const parsed = parseCurl("curl https://api.github.com/users/octocat");
      assert.equal(parsed.url, "https://api.github.com/users/octocat");
      assert.equal(parsed.method, "GET");
      assert.equal(parsed.body, null);
    });

    it("should parse headers and POST body", () => {
      const curl = `curl -X POST https://api.example.com/items \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer test-token" \\
        -d '{"name":"Widget","qty":5}'`;
      const parsed = parseCurl(curl);

      assert.equal(parsed.url, "https://api.example.com/items");
      assert.equal(parsed.method, "POST");
      assert.equal(parsed.headers["Content-Type"], "application/json");
      assert.equal(parsed.headers["Authorization"], "Bearer test-token");
      assert.equal(parsed.body, '{"name":"Widget","qty":5}');
    });

    it("should parse basic authentication flag -u", () => {
      const curl = "curl -u myuser:mypass https://api.example.com/auth";
      const parsed = parseCurl(curl);
      assert.ok(parsed.headers["Authorization"].startsWith("Basic "));
    });
  });

  describe("Code Generators", () => {
    const sample = parseCurl(`curl -X POST https://api.example.com/data -H "Accept: application/json" -d '{"score":100}'`);

    it("should generate Fetch snippet with async function", () => {
      const code = generateFetchCode(sample);
      assert.ok(code.includes('await fetch("https://api.example.com/data"'));
      assert.ok(code.includes('method: "POST"'));
      assert.ok(code.includes("JSON.stringify"));
    });

    it("should generate Axios snippet", () => {
      const code = generateAxiosCode(sample);
      assert.ok(code.includes('import axios from "axios";'));
      assert.ok(code.includes('url: "https://api.example.com/data"'));
      assert.ok(code.includes('method: "post"'));
    });

    it("should generate Python requests snippet", () => {
      const code = generatePythonRequestsCode(sample);
      assert.ok(code.includes("import requests"));
      assert.ok(code.includes('requests.request("POST"'));
    });

    it("should generate Go net/http snippet", () => {
      const code = generateGoHttpCode(sample);
      assert.ok(code.includes('http.NewRequest(method, url, payload)'));
      assert.ok(code.includes('req.Header.Add("Accept", "application/json")'));
    });
  });
});
