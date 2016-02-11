/*!
 * Copyright 2010 - 2015 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(["pentaho/util/error"], function(error) {

  /*global describe:false, it:false, expect:false, beforeEach:false, afterEach:false, spyOn:false, JSON:false*/

  describe("pentaho.util.error -", function() {
    it("is defined", function() {
      expect(error instanceof Object).toBe(true);
    });

    function itShouldHaveMessage(methodName, withArgs, message) {
      it("should have message «" + message + "» when called with arguments " + JSON.stringify(withArgs), function() {

        var result = error[methodName].apply(error, withArgs);

        expect(result instanceof Error).toBe(true);
        expect(result.message).toBe(message);
      });
    }

    describe("argRequired(name, (text)) -", function() {
      it("should be a function", function() {
        expect(typeof error.argRequired).toBe("function");
      });

      itShouldHaveMessage("argRequired", ["foo"       ], "Argument required: 'foo'.");
      itShouldHaveMessage("argRequired", ["foo", "bar"], "Argument required: 'foo'. bar.");
    });

    describe("argInvalid(name, (reason)) -", function() {
      it("should be a function", function() {
        expect(typeof error.argInvalid).toBe("function");
      });

      itShouldHaveMessage("argInvalid", ["foo"       ], "Argument invalid: 'foo'.");
      itShouldHaveMessage("argInvalid", ["foo", "bar"], "Argument invalid: 'foo'. bar.");
    });

    describe("argInvalidType(name, [expectedType], (gotType)) -", function() {
      it("should be a function", function() {
        expect(typeof error.argInvalidType).toBe("function");
      });

      itShouldHaveMessage("argInvalidType", ["foo", "string"],
          "Argument invalid: 'foo'. Expected type to be string.");

      itShouldHaveMessage("argInvalidType", ["foo", ["string"]],
          "Argument invalid: 'foo'. Expected type to be string.");

      itShouldHaveMessage("argInvalidType", ["foo", "string", "boolean"],
          "Argument invalid: 'foo'. Expected type to be string, but got boolean.");

      itShouldHaveMessage("argInvalidType", ["foo", ["string"], "boolean"],
          "Argument invalid: 'foo'. Expected type to be string, but got boolean.");

      itShouldHaveMessage("argInvalidType", ["foo", ["string", "function"], "boolean"],
          "Argument invalid: 'foo'. Expected type to be one of string or function, but got boolean.");

      itShouldHaveMessage("argInvalidType", ["foo", ["string", "function"]],
          "Argument invalid: 'foo'. Expected type to be one of string or function.");

      itShouldHaveMessage("argInvalidType", ["foo", ["string", "function", "Array"], "boolean"],
          "Argument invalid: 'foo'. Expected type to be one of string, function or Array, but got boolean.");
    });

    describe("argOutOfRange(name) -", function() {
      it("should be a function", function() {
        expect(typeof error.argOutOfRange).toBe("function");
      });

      itShouldHaveMessage("argOutOfRange", ["foo"], "Argument invalid: 'foo'. Out of range.");
    });

    describe("operInvalid((text)) -", function() {
      it("should be a function", function() {
        expect(typeof error.operInvalid).toBe("function");
      });

      itShouldHaveMessage("operInvalid", [], "Operation invalid.");
      itShouldHaveMessage("operInvalid", ["Invalid state."], "Operation invalid. Invalid state.");
    });

    describe("notImplemented((text)) -", function() {
      it("should be a function", function() {
        expect(typeof error.notImplemented).toBe("function");
      });

      itShouldHaveMessage("notImplemented", [], "Not Implemented.");
      itShouldHaveMessage("notImplemented", ["Don't be lazy!"], "Not Implemented. Don't be lazy!");
    });
  });
});
