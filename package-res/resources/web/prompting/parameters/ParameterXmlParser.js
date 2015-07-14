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
 *
 */

/**
 * @class ParameterXmlParser
 */
define(['cdf/lib/Base', 'common-ui/util/base64', './Parameter', './ParameterDefinition', './ParameterGroup', './ParameterValue'],
    function (Base, Base64Util, Parameter, ParameterDefinition, ParameterGroup, ParameterValue) {

      /**
       * Parses the xml retrieved from the server call
       * @method _parseXML
       * @param {Object} data The data to be parsed
       * @returns {Object} The xml parsed from a DOMParser
       * @private
       */
      var _parseXML = function (data) {
        var domParser = new DOMParser();
        var xml = domParser.parseFromString(data, "text/xml");
        var documentElement = xml.documentElement;

        if (!documentElement || !documentElement.nodeName || documentElement.nodeName === "parsererror") {
          $.error("Invalid XML: " + data);
        }

        return xml;
      };

      /**
       * Parses the errors from the parsed xml
       * @method _parseErrors
       * @param {ParameterDefinition} paramDefn The parameter definition to store the errors parsed
       * @param {Object} xmlRoot The xml to parse errors
       * @private
       */
      var _parseErrors = function (paramDefn, xmlRoot) {
        var addToParameter = function (paramDefn, paramName, message) {
          var errorList = paramDefn.errors[paramName];
          if (!errorList) {
            errorList = [];
          }
          errorList.push(message);
          paramDefn.errors[paramName] = errorList;
        };

        xmlRoot.find('error').each(function (i, e) {
          var error = $(e);
          var paramName = error.attr('parameter');
          var message = error.attr('message');
          addToParameter(paramDefn, paramName, message);
        }.bind(this));

        xmlRoot.find('global-error').each(function (i, e) {
          var error = $(e);
          var message = error.attr('message');
          addToParameter(paramDefn, null, message);
        }.bind(this));
      };

      /**
       * Parses the parameters and stores the info in the ParameterDefinition
       * @method _parseParameters
       * @param {ParameterDefinition} paramDefn The parameters objects storing the parameter info
       * @param {Object} parametersNode The node of parameter to iterate
       * @private
       */
      var _parseParameters = function (paramDefn, parametersNode) {
        parametersNode.find('parameter').each(function(i, node) {
          var param = _parseParameter(node);
          node = $(node);
          var groupName = param.attributes['parameter-group'];
          if (groupName == undefined || !$.trim(groupName).length) {
            groupName = 'parameters'; // default group
          }
          var group = paramDefn.getParameterGroup(groupName);
          if (!group) {
            group = new ParameterGroup();
            group.name = groupName;
            group.label = param.attributes['parameter-group-label'];
            paramDefn.parameterGroups.push(group);
          }
          group.parameters.push(param);
        }.bind(this));
      };

      /**
       * Parses a parameter, creating a parameter instance based on the info passed as parameter
       * @method _parseParameter
       * @param {Object} node The xml node containing the parameter information
       * @returns {Parameter} The Parameter instance
       * @private
       */
      var _parseParameter = function (node) {
        var param = new Parameter();

        node = $(node);
        param.name = node.attr('name');
        param.mandatory = 'true' == node.attr('is-mandatory');
        param.strict = 'true' == node.attr('is-strict');
        param.list = 'true' == node.attr('is-list');
        param.multiSelect = 'true' == node.attr('is-multi-select');
        param.type = node.attr('type');
        param.timezoneHint = node.attr('timezone-hint');

        // TODO: Support namespaces
        $(node).find('attribute').each(function(i, attr) {
          attr = $(attr);
          param.attributes[attr.attr('name')] = attr.attr('value');
        });

        param.values = _parseParameterValues(node, param);
        return param;
      };

      /**
       * Parses the xml node fetching the parameter values
       * @method _parseParameterValues
       * @param {Object} node The xml node containing the parameter information
       * @param {Parameter} parameter Parameter with the current parameter metadata
       * @returns {Array} Array with the
       * @private
       */
      var _parseParameterValues = function (node, parameter) {
        var values = [];
        $(node).find('values value').each(function(i, value) {
          var pVal = new ParameterValue();

          value = $(value);

          if ('true' == value.attr('encoded')) {
            pVal.label = Base64Util.base64Decode(value.attr('label'));
          } else {
            pVal.label = value.attr('label');
          }
          if ('true' == value.attr('null')) {
            pVal.value = ''; // Dashboards doesn't play nicely with null values for parameters
          } else if ('true' == value.attr('encoded')) {
            pVal.value = Base64Util.base64Decode(value.attr('value'));
          } else {
            pVal.value = value.attr('value');
          }
          pVal.type = value.attr('type');
          if (pVal.type == undefined || !$.trim(pVal.type).length) {
            pVal.type = parameter.type;
          }
          pVal.selected = 'true' == value.attr('selected');

          pVal.value = _normalizeParameterValue(parameter, pVal.type, pVal.value);
          values.push(pVal);
        }.bind(this));
        return values;
      };

      /**
       * Called for every parameter value that is parsed. Override this to update the parameter
       * value at parse time.
       * @method _normalizeParameterValue
       * @param {Parameter} parameter The Parameter instance
       * @param {String} type The type of the parameter
       * @param {Object} value The value to be normalized
       * @return {Object} The normalized value
       * @private
       */
      var _normalizeParameterValue = function (parameter, type, value) {
        return value;
      };

      return Base.extend({
        /**
         * Parses the xml received from the server and returns and instance of ParameterDefinition
         * @method parseParameterXml
         * @param xmlString String with the xml
         * @returns ParameterDefinition instance
         */
        parseParameterXml: function (xmlString) {
          var xml = $(_parseXML(xmlString));

          if (xml.find('parsererror').length > 0) {
            throw xmlString;
          }

          var paramDefn = new ParameterDefinition();
          var parameters = $(xml.find('parameters')[0]);

          paramDefn.promptNeeded = 'true' == parameters.attr('is-prompt-needed');
          paramDefn.ignoreBiServer5538 = 'true' == parameters.attr('ignore-biserver-5538');
          paramDefn.paginate = 'true' == parameters.attr('paginate');
          paramDefn.layout = parameters.attr('layout');

          var parseInteger = function(s, def) {
            var n = parseInt(s);
            return 'NaN' == n ? def : n;
          }
          paramDefn.page = parseInteger(parameters.attr('accepted-page'), 0);
          paramDefn.totalPages = parseInteger(parameters.attr('page-count'), 0);

          paramDefn.autoSubmit = parameters.attr('autoSubmit');
          if (paramDefn.autoSubmit == 'true') {
            paramDefn.autoSubmit = true;
          } else if (paramDefn.autoSubmit == 'false') {
            paramDefn.autoSubmit = false;
          } else {
            paramDefn.autoSubmit = undefined;
          }

          paramDefn.autoSubmitUI = 'true' == parameters.attr('autoSubmitUI');

          _parseParameters(paramDefn, parameters);
          _parseErrors(paramDefn, xml);

          return paramDefn;
        }
      });
    }
);
