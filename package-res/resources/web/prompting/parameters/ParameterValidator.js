/*!
 * Copyright 2010 - 2016 Pentaho Corporation.  All rights reserved.
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
 * The ParameterValidator Class
 *
 * @name ParameterValidator
 * @class
 */
define(['cdf/lib/Base'],
    function (Base) {

      var addErrorToParameter = function (paramDefn, paramName, message) {
        var errorList = paramDefn.errors[paramName];
        if (!errorList) {
          errorList = [];
        }
        errorList.push(message);
        paramDefn.errors[paramName] = errorList;
      };

      var removeError = function (paramDefn, paramName) {
        var errorList = paramDefn.errors[paramName];
        if (errorList) {
          delete paramDefn.errors[paramName];
        }
      };

      var isValidValue = function (parameterValues, computedValue) {
        for(var i=0; i<parameterValues.length; i++) {
          if(computedValue == parameterValues[i].value) {
            // value is found
            return true;
          }
        }
        return false;
      };

      var isValidValues = function (parameterValues, computedValue) {
        for(var i=0; i<computedValue.length; i++) {
          if(!isValidValue(parameterValues, computedValue[i])) {
            // value not found
            return false;
          }
        }
        return true;
      };

      var setSelectedValue = function (paramDefn, currentParameter, untrustedValue) {
        if(currentParameter.multiSelect) {
          for(var k=0; k<currentParameter.values.length; k++) {
            if(untrustedValue.indexOf(currentParameter.values[k].value) != -1) {
              currentParameter.values[k].selected = true;
              // remove error, if any
              removeError(paramDefn, currentParameter.name);
            }
          }
        } else {
          for(var k=0; k<currentParameter.values.length; k++) {
            if(untrustedValue == currentParameter.values[k].value) {
              currentParameter.values[k].selected = true;
              // remove error, if any
              removeError(paramDefn, currentParameter.name);
              break;
            }
          }
        }
      };

      return Base.extend({

        validateSingleParameter: function (paramDefn, paramName, untrustedValue) {
          for(var i=0; i<paramDefn.parameterGroups.length; i++) {
            if(paramDefn.parameterGroups[i].name = "parameters") {
              for(var j=0; j<paramDefn.parameterGroups[i].parameters.length; j++) {
                if(paramName == paramDefn.parameterGroups[i].parameters[j].name) {

                  // validate untrusted parameter value
                  var currentParameter = paramDefn.parameterGroups[i].parameters[j];
                  if(typeof untrustedValue == 'undefined' || untrustedValue == '') {
                    var defaultValue;
                    if('true' == currentParameter.attributes["autofill-selection"]) {
                      if(currentParameter.values.length > 0) {
                        if(currentParameter.multiSelect) {
                          defaultValue = [];
                          defaultValue.push(currentParameter.values[0]);
                        } else {
                          defaultValue = currentParameter.values[0];
                        }
                      }
                      untrustedValue = defaultValue;
                    }
                  }
                  if(currentParameter.mandatory) {
                    if(typeof untrustedValue == 'undefined' || untrustedValue == '') {
                      // add error
                      addErrorToParameter(paramDefn, paramName, "This prompt value is of an invalid value");
                    }
                  }
                  var values = [];
                  if(currentParameter.multiSelect) {
                    untrustedValue.forEach(function(value) {
                      values.push(value);
                    });
                  } else {
                    values.push(untrustedValue);
                  }
                  if(currentParameter.strict) {
                    if(!isValidValues(currentParameter.values, values)) {
                      if(typeof values != 'undefined' && 'true' == currentParameter.attributes["re-evaluate-on-failed-values"]) {
                        // validate one more time? (https://github.com/pentaho/pentaho-reporting/blob/master/engine/core/source/org/pentaho/reporting/engine/classic/core/parameters/DefaultReportParameterValidator.java#L235-L238)
                      } else {
                        // add error
                        addErrorToParameter(paramDefn, paramName, "This prompt value is of an invalid value");
                      }
                    }
                  }

                  // restore default selections before setting trusted values
                  for(var k=0; k<currentParameter.values.length; k++) {
                    currentParameter.values[k].selected = false;
                  }
                  // all validations passed, set trusted values
                  setSelectedValue(paramDefn, currentParameter, untrustedValue);
                  break;
                }
              }
              break;
            }
          }
        },

        checkParametersErrors: function (paramDefn) {
          var hasErrors = false;
          for(var i=0; i<paramDefn.parameterGroups.length; i++) {
            for(var j=0; j<paramDefn.parameterGroups[i].parameters.length; j++) {
              var errorList = paramDefn.errors[paramDefn.parameterGroups[i].parameters[j].name];
              if (errorList) {
                hasErrors = true;
                if(!paramDefn.promptNeeded) {
                  paramDefn.promptNeeded = true;
                }
                break;
              }
            }
          }
          if(!hasErrors) {
            // no errors at all, show the report
            paramDefn.promptNeeded = false;
          }
        }
      });
    }
);
