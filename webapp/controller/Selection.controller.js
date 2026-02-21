sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/oDataModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    "sap/ui/core/format/DateFormat",
    "sap/ushell/services/PersonalizationV2"
], function (Controller, oDataModel, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token, DateFormat, PersonalizationV2) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oFieldMonDataModel, oResourceBundle, UIComponent;

    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.Selection", {
        onInit: function () {
            oController = this;
            UIComponent = oController.getOwnerComponent();
            oFieldMonDataModel = oController.getOwnerComponent().getModel();
            oRouter = UIComponent.getRouter();
            oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();

            // var oServiceOrderModel = new oDataModel("/sap/opu/odata/sap/ZWM_SS_ORDER_OEB_SRV/", {
            //     json: true,
            //     useBatch: false
            // });
            // var oServiceOrderJsonModel = new JSONModel();
            // oServiceOrderModel.read("/Service_OrderSet", {
            //     success: function (oData) {
            //         var oResults = oData.results;
            //         if (oResults.length) {
            //             oServiceOrderJsonModel.setData(oResults);
            //         } else {
            //            oServiceOrderJsonModel.setData(oResults);
            //         }
            //     }                
            // });
            // oController.getView().setModel(oServiceOrderJsonModel, "ServiceOrderModel");

            var oSelectionModel = new JSONModel({
                bPageBusy: false,
                minDate: new Date(),
                OrderStatusSelected: [],
                bIsSelScreenInvalidate: false,
                FunctionalLocation: "",
                oServiceOrderDates: {
                    CompletedOn: {
                        From: "", //oController._fnCurrentMonthStartDate(true),
                        To: "", //oController._fnCurrentMonthStartDate(false)
                    },
                    CreatedOn: {
                        From: "", //oController._fnCurrentMonthStartDate(true)
                        To: "" //oController._fnCurrentMonthStartDate(false)
                    },
                    BasicStart: {
                        From: "",//oController._fnCurrentMonthStartDate(true)
                        To: "" // oController._fnCurrentMonthStartDate(false)
                    }
                },
                oSelected: {
                    sCompletedOnFrom: "",
                    sCompletedOnTo: "",
                    sMainActivity: "",
                    sCreatedOnFrom: "",
                    sCreatedOnTo: "",
                    sBasicStartFrom: "",
                    sBasicStartTo: "",
                    PlanningPlant: [],
                    PlannerGroup: [],
                    WorkCenter: [],
                    MainActType: [],
                    FuncLoc: [],
                    ServiceOrder: [],
                    OrderType: [],
                    oFilter: {
                        bMobileWorkForce: false,
                        bOnlyOpConfield: false,
                        bShowOnlyMeterTank: false,
                        sLayout: ""
                    },
                    OPerationStatus: [],
                    MeterAction: []
                },
                OrderStatus: [
                    { Key: 'DISP', description: 'Dispatched' },
                    { Key: 'ASSN', description: 'Assigned' },
                    { Key: 'TECO', description: 'Technically Completed' }
                ],
                OrderOperationStatus: [
                    { Key: "HOLD", description: "Hold" },
                    { Key: "SRDE", description: "Site Readiness Date entered" },
                    { Key: "RCC", description: "Ready for Customer Confirm" },
                    { Key: "TRFD", description: "Trenching Ready for Dispatch" },
                    { Key: "ASSN", description: "Assigned" },
                    { Key: "DISP", description: "Dispatched" },
                    { Key: "SINR", description: "Site Not Ready" },
                    { Key: "RSRD", description: "Request Site Readiness Date" },
                    { Key: "CNDI", description: "Cancel Dispatch" },
                    { Key: "TCOM", description: "Trenching Complete" },
                    { Key: "IRFD", description: "Install Ready for Dispatch" },
                    { Key: "MCOM", description: "Meter Install Complete" },
                    { Key: "RVWP", description: "Review Pending" },
                    { Key: "RVWC", description: "Review Complete" }
                ],
                OperationStatus: [
                    { Key: "CNCL", description: "Cancel/Closed" },
                    { Key: "ESAR", description: "ESA Required" },
                    { Key: "ASGD", description: "Assigned" },
                    { Key: "SCHD", description: "Scheduled" },
                    { Key: "RDFD", description: "Ready for Dispatch" },
                    { Key: "DISP", description: "Dispatched" },
                    { Key: "CNDI", description: "Cancel Dispatch" },
                    { Key: "TRKA", description: "Truck Assigned" },
                    { Key: "ONST", description: "On Site" },
                    { Key: "WKCO", description: "Work Completed" },
                    { Key: "FINC", description: "Field Incomplete" },
                    { Key: "ERRD", description: "Error In Dispatch" }
                ],
                MeterAction: [
                    // { key: "BLANK", description: "BLANK" },
                    { Key: "DISCONNECT", description: "DISCONNECT" },
                    { Key: "EXCHANGE", description: "EXCHANGE" },
                    { Key: "FIX", description: "FIX" },
                    { Key: "INSTALL", description: "INSTALL" },
                    { Key: "RECONNECT", description: "RECONNECT" },
                    { Key: "REMOVE", description: "REMOVE" },
                    { Key: "SEALCHANGE", description: "SEAL CHANGE" }
                ]
            });

            oSelectionScreenModel = oSelectionModel;
            var user = sap.ushell.Container.getUser();
            oController.userId = user.getId();
            oController.getView().setModel(oSelectionModel, "FieldMonSelModel");
            oController.getOwnerComponent().setModel(new JSONModel({}), "GlobalFieldMonModel");
            var oMultiComboBox = oController.getView().byId("idMeterAction");
            var aSelectedKeys = ["DISCONNECT", "EXCHANGE","FIX","INSTALL","RECONNECT","REMOVE","SEALCHANGE"];
            oMultiComboBox.setSelectedKeys(aSelectedKeys);
            this._initPersonalizationService();
        },
        _initPersonalizationService: function () {
            //debugger;
            var oView = this.getView();
            var oVariantManagement = oView.byId("idVariantManagement");
            sap.ushell.Container.getServiceAsync("Personalization").then(function (oPersonalizationService) {
                var oPersId = {
                    container: "InputFieldVariants",
                    item: "InputFields"
                };
                oPersonalizationService.getContainer(oPersId.container).then(function (oContainer) {
                    this._oContainer = oContainer;
                    var oVariantSet = oContainer.getItemValue(oPersId.item) || { variants: [], defaultVariant: "" };
                    this._loadVariants(oVariantSet);

                    oVariantManagement.setModel(new JSONModel(oVariantSet.variants), "variantItems");
                    oVariantManagement.setDefaultVariantKey(oVariantSet.defaultVariant);

                    this._applyVariant(oVariantSet.defaultVariant, oController._defaultVariantName);
                }.bind(this)).catch(function (oError) {
                    //MessageToast.show("Error Loading Personalization Container:" + oError.message);
                });
            }.bind(this)).catch(function (oError) {
                //MessageToast.show("Error accessing personalization service: " + oError.message);
            });
        },

        _loadVariants: function (oVariantSet) {
            //debugger;
            var oVM = oController.getView().byId("idVariantManagement");
            var defaultVariant = oController._fngetDefaultVariant(oVM);
            oController._defaultVariantKey = defaultVariant;
            oVariantSet.variants.forEach(function (oVariant) {
                oVM.addVariantItem({
                    key: oVariant.key,
                    text: oVariant.text,
                    readOnly: false,
                    executeOnSelection: true
                });
            });
            //oController.getView().getModel("FieldMonSelModel").setProperty("/Variants", aVariants);
        },
        _fngetDefaultVariant: function (VM) {
            var objVariant = {}, objVariantItems = [], defaultVariant = '';
            objVariant = VM.oContext.getModel().getData();
            defaultVariant = objVariant["Selection--idVariantManagement"].defaultVariant;
            objVariantItems = objVariant["Selection--idVariantManagement"].variants;
            for (var i = 0; i < objVariantItems.length; i++) {
                if (defaultVariant === objVariantItems[i].key) {
                    oController._defaultVariantName = objVariantItems[i].title;
                }
            }
            return defaultVariant;
        },
        _applyVariant: function (sVariantKey, sName) {
            //debugger;
            var oVariantModel = oController.getView().getModel("FieldMonSelModel");
            var oVariantSet = this._oContainer.getItemValue("variantSet") || { "variants": [] };
            var oDefaultVariant = oVariantSet.defaultVariant;

            var oVariant = oVariantSet.variants.find(function (v) {
                if (sName === '' && sVariantKey !== '') {
                    return v.key === sVariantKey;
                }
                else if (sName === '' && sVariantKey === '') {
                    return v.key === oDefaultVariant;
                }
                else {
                    return v.text === sName;
                }
            });

            if (oVariant) {
                var objWorkCenter = [], objPlannerGroup = [], objServiceOrder = [], objOrderType = [];
                var oData = oVariant.data;
                oVariantModel.setData(oData, true);
                objWorkCenter = oVariantModel.getProperty("/oSelected/WorkCenter");
                objPlannerGroup = oVariantModel.getProperty("/oSelected/PlannerGroup");
                objServiceOrder = oVariantModel.getProperty("/oSelected/ServiceOrder");
                objOrderType = oVariantModel.getProperty("/oSelected/OrderType");
                //

                if (objWorkCenter.length > 0) oController._fnBindVariantSelectionFields(objWorkCenter, 'idWorkCenter');
                if (objPlannerGroup.length > 0) oController._fnBindVariantSelectionFields(objPlannerGroup, 'idPlannerGroup');
                if (objServiceOrder.length > 0) oController._fnBindVariantSelectionFields(objServiceOrder, 'idServiceOrder');
                if (objOrderType.length > 0) oController._fnBindVariantSelectionFields(objOrderType, 'idOrderType');

            }
        },
        _fnBindVariantSelectionFields: function (objSelection, objId) {
            for (var i = 0; i < objSelection.length; i++) {
                var oMultiInput = oController.getView().byId(objId);
                var aToken = new Token({
                    key: objSelection[i].key,
                    text: objSelection[i].text,
                });

                oMultiInput.addToken(aToken);
                oMultiInput.setValue("");
            }
        },

        onSaveVariant: function (oEvent) {
           // debugger;
            var oParameters = oEvent.getParameters();
            var sVariantKey = oParameters.key || Date.now().toString();
            var sVariantText = oParameters.name;
            var bOverwrite = oParameters.overwrite;
            var bDefault = oParameters.def;
            var oVariantData = oController.getView().getModel("FieldMonSelModel").getData();

            var oVariantSet = this._oContainer.getItemValue("variantSet") || { "variants": [], defaultVariant: "" }
            var oVariantManagement = oController.getView().byId("idVariantManagement");
            if (bOverwrite) {
                var oExistingVariant = oVariantSet.variants.find(function (v) {
                    return v.key === sVariantKey;
                });
                if (oExistingVariant) {
                    oExistingVariant.text = sVariantText;
                    oExistingVariant.data = oVariantData;
                }
            } else {
                oVariantSet.variants.push({
                    key: sVariantKey,
                    text: sVariantText,
                    data: oVariantData
                });
            }
            if (bDefault) {
                oVariantSet.defaultVariant = sVariantKey;
                oVariantManagement.setDefaultVariantKey(sVariantKey);
            }
            this._oContainer.setItemValue("variantSet", oVariantSet);
            this._oContainer.save().then(function () {
                MessageToast.show("Variant saved successfully!");
            }).catch(function (oError) {
                MessageToast.show("Error saving variant:" + oError.message);
            })

        },
        onSelectVariant: function (oEvent) {
           // debugger;
            var sVariantKey = oEvent.getParameter("key");
            var objVariant = {}, objVariantItems = [], oName = '';
            objVariant = oEvent.getSource().oContext.getModel().getData();
            objVariantItems = objVariant["Selection--idVariantManagement"].variants;

            for (var i = 0; i < objVariantItems.length; i++) {
                if (sVariantKey === objVariantItems[i].key) {
                    oName = objVariantItems[i].title;
                }
            }
            if (sVariantKey === 'Selection--idVariantManagement') {
                window.location.reload();
            }
            else {
                //var objVariant = [];
                var oVariantModel = oController.getView().getModel("FieldMonSelModel");
                oVariantModel.setData({});
                oController._fnSetEmptySelectedFields('idWorkCenter');
                oController._fnSetEmptySelectedFields('idPlannerGroup');
                oController._fnSetEmptySelectedFields('idServiceOrder');
                oController._fnSetEmptySelectedFields('idOrderType');
            }

            this._applyVariant(sVariantKey, oName);
        },
        _fnSetEmptySelectedFields: function (objId) {
            //debugger;
            var oMultiInput = oController.getView().byId(objId);
            oMultiInput.removeAllTokens();
            oMultiInput.setValue("");
        },
        onManageVariant: function (oEvent) {
            //debugger;
            var objVariant = {}, objVariantItems = [], oName = '';
            objVariant = oEvent.getSource().oContext.getModel().getData();
            objVariantItems = objVariant["Selection--idVariantManagement"].variants;

            var oParameters = oEvent.getParameters();
            var aRenamed = oEvent.getParameter("renamed");
            var aDeleted = oEvent.getParameter("deleted");
            var oVariantSet = this._oContainer.getItemValue("variantSet") || { variants: [] };
            if (aDeleted !== undefined) {
                oParameters.deleted.forEach(function (sKey) {
                   // debugger;
                    for (var i = 0; i < objVariantItems.length; i++) {
                        if (sKey !== objVariantItems[i].key) {
                            oName = objVariantItems[i].title;
                            oVariantSet.variants = oVariantSet.variants.filter(function (v) {
                                return v.text === oName;
                            });
                        }
                    }
                });
            }
            if (aRenamed !== undefined) {
                oParameters.renamed.forEach(function (oRenamed) {
                    for (var i = 0; i < objVariantItems.length; i++) {
                        if (oRenamed.key === objVariantItems[i].key) {
                            oName = objVariantItems[i].title;
                            var oVariant = oVariantSet.variants.find(function (v) {
                                return v.text === oName;
                            });
                            if (oVariant) {
                                oVariant.text = oRenamed.name;
                            }
                        }
                    }
                });
            }

            if (oParameters.def) {
                oVariantSet.defaultVariant = oParameters.def;
                oController.getView().byId("idVariantManagement").setDefaultVariantKey(oParameters.def);
            }
            this._oContainer.setItemValue("variantSet", oVariantSet);
            this._oContainer.save().then(function () {
                MessageToast.show("Variants managed successfully!");
            }).catch(function (oError) {
                MessageToast.show("Error managing variants:" + oError.message);
            });

        },
        // _fnCurrentMonthStartDate : function(){
        _fnCurrentMonthStartDate: function (bIsfromDate) {
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance("dd.MM.yyyy");
            if (bIsfromDate) {
                var currentDate = new Date();
                var currentMonth = currentDate.getMonth();
                var currentYear = currentDate.getFullYear();
                var oDate = new Date(currentYear, currentMonth, 1);
            } else {
                var oDate = new Date();
            }
            return dateFormat.format(oDate);
        },
        // },
        onValueHelp: function (oEvent) {
            var sInputId = oEvent.getParameter("id");
            var oInput = sap.ui.getCore().byId(sInputId);
            var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: "Value Help",
                supportMultiselect: true,
                supportRanges: false,
                supportRangesOnly: false,
                key: "Key",
                descriptionKey: "description",
                ok: function (oEvent) {
                    var aTokens = oEvent.getParameter("tokens");
                    oInput.setTokens(aTokens);
                    oValueHelpDialog.close();
                },
                cancel: function () {
                    oValueHelpDialog.close();
                }
            });
            var oColModel = new sap.ui.model.json.JSONModel();
            oColModel.setData({
                cols: [
                    { label: "Key", template: "Key" },
                    { label: "Description", template: "description" }
                ]
            });
            oValueHelpDialog.getTable().setModel(oColModel, "columns");
            var oRowsModel = new sap.ui.model.json.JSONModel();
            oRowsModel.setData({ rows: [] });
            oValueHelpDialog.getTable().setModel(oRowsModel);
            oValueHelpDialog.getTable().bindRows("/rows");
            oValueHelpDialog.setRangeKeyFields([]);
            oValueHelpDialog.setTokens(oInput.getTokens());
            oValueHelpDialog.open();
        },

        onPressNext: function () {
           // debugger;
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sPath = "/Monitoring_FiledWorkSet";
            oModel.setProperty("/bPageBusy", true);
            var aFilter = oController._fnReturnFilterparameter();
            // var oBus = sap.ui.getCore().getEventBus();
            // oBus.publish("filterChannel", "passFilters", { filters: aFilter });
            oFieldMonDataModel.read(sPath, {
                filters: aFilter,
                success: function (oData) {
                    var oResults = oData.results;
                    if (oResults.length) {
                        UIComponent.getModel("GlobalFieldMonModel").setProperty("/FiledMonList", oResults);
                        UIComponent.getModel("GlobalFieldMonModel").setProperty("/SelParameters", aFilter);
                        oRouter.navTo("FieldMonList");
                    } else {
                        MessageBox.error("No results found for selection criteria");
                    }
                    oModel.setProperty("/bPageBusy", false);
                },
                error: function (oError) {
                    var oMessage;
                    oModel.setProperty("/bPageBusy", false);
                    if (oError.responseText.startsWith("<")) {
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                        oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                    } else {
                        var oResponseText = oError.responseText;
                        var sParsedResponse = JSON.parse(oResponseText);
                        oMessage = sParsedResponse.error.message.value;
                    }
                    MessageBox.error(oMessage);
                }
            });
        },
        onSubmitOrderNumber: function (oEvent) {
            var oMultiInput = oEvent.getSource();
            // var oMultiServiceOrder = oEvent.getSource().getTokens();
            // if(oMultiServiceOrder.length === 0)
            // {
            //     return MessageBox.error("enter service order number...")
            // }
            // let aFilter = [];
            // var sOrder = "";
            // if(oMultiServiceOrder.length>0)
            // {
            //     for (let i = 0; i <= oMultiServiceOrder.length - 1; i++) {
            //         sOrder = oMultiServiceOrder[i].getText();
            //         sOrder = profileRole.replace("=", "");
            //         aFilter.push(new Filter("ORDER_NO", FilterOperator.EQ, sOrder));
            //     }
            // }           

            var oModel = oController.getView().getModel("FieldMonSelModel");
            oModel.setProperty("/bPageBusy", true);
            var sPath = "/Monitoring_FiledWorkSet('" + oMultiInput.getValue() + "')";
            oFieldMonDataModel.read(sPath, {
                success: function (oData) {
                    var oToken = new sap.m.Token({
                        key: oData.ORDER_NO,
                        text: oData.ORDER_NO
                    });
                    oMultiInput.addToken(oToken);
                    oMultiInput.setValue("");
                    oModel.setProperty("/bPageBusy", false);
                },
                error: function (oError) {
                    var oMessage;
                    var oModel = oController.getView().getModel("FieldMonSelModel");
                    oMultiInput.setValue("");
                    oModel.setProperty("/bPageBusy", false);
                    if (oError.responseText.startsWith("<")) {
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                        oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
                    } else {
                        var oResponseText = oError.responseText;
                        var sParsedResponse = JSON.parse(oResponseText);
                        oMessage = sParsedResponse.error.message.value;
                    }
                    MessageBox.error(oMessage);
                }
            });
        },
        // onSelectFuncLoc: function (oEvent) {
        //     debugger;
        //     var oSelectedItem = oEvent.getParameter("selectedRow");
        //     var oMultiInput = oController.getView().byId("idFuncLoc");
        //     oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        // },
        // onPressPlannerGroup: function (oEvent) {
        //     var oSelectedItem = oEvent.getParameter("selectedRow");
        //     var oMultiInput = oController.getView().byId("idPlannerGroup");
        //     oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        // },
        // onWorkCenterSuggestionItemPress: function (oEvent) {
        //     var oSelectedItem = oEvent.getParameter("selectedRow");
        //     var oMultiInput = oController.getView().byId("idWorkCenter");
        //     oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        // },
        // onOrderSuggestionItemPress: function (oEvent) {
        //     var oSelectedItem = oEvent.getParameter("selectedRow");
        //     var oMultiInput = oController.getView().byId("idServiceOrder");
        //     oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        // },
        // onOrderTypeSuggestionItemPress: function (oEvent) {
        //     var oSelectedItem = oEvent.getParameter("selectedRow");
        //     var oMultiInput = oController.getView().byId("idOrderType");
        //     oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        // },
        onSuggestionItemSelected: function (oSelectedItem, oMultiInput) {
           // debugger;
            var oSelectedCells = oSelectedItem.getCells();
            var oToken = new Token({
                key: oSelectedCells[1].getText(),
                text: oSelectedCells[0].getText()
            });
            oMultiInput.addToken(oToken);
            oMultiInput.setValue("");
        },
        _getTokens: function (oSource) {
            var aList = [];
            var aTokens = oSource.getTokens();
            aList = aTokens.map(object => object.getText());
            return aList;
        },
        _fnFormateDate: function (sUnFormatedDate) {
            var parts = sUnFormatedDate.split(".");
            var day = parseInt(parts[0], 10);
            var month = parseInt(parts[1], 10) - 1;
            var year = parseInt(parts[2], 10);
            var date = new Date(year, month, day);
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
            return dateFormat.format(date);
        },
        OnChangeCompletedOnDate: function () {
            var oFromDate = oController.getView().byId("idcompletedOnDatePicker");
            var oToDate = oController.getView().byId("idcompletedOnDatePickerTo");
            oController._DateRangeValidation(oFromDate, oToDate);
        },
        onchangeCreatedOn: function () {
            var oFromDate = oController.getView().byId("idcreatedOnDatePicker");
            var oToDate = oController.getView().byId("idcreatedOnDatePickerTo");
            oController._DateRangeValidation(oFromDate, oToDate);
        },
        onChangeBasicStartDate: function () {
            var oFromDate = oController.getView().byId("idbasicStartDatePicker");
            var oToDate = oController.getView().byId("idbasicStartDatePickerTO");
            oController._DateRangeValidation(oFromDate, oToDate);
        },
        _DateRangeValidation: function (oFromDateInput, oToDateInput) {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var FromDate = oFromDateInput.getValue();
            var ToDate = oToDateInput.getValue();
            if (FromDate && ToDate) {
                var fromDate = new Date(FromDate);
                var toDate = new Date(ToDate);
                if (toDate < fromDate) {
                    oFromDateInput.setValueStateText("Invalid Date Range");
                    oFromDateInput.setValueState(sap.ui.core.ValueState.Error);
                    oToDateInput.setValueStateText("Invalid Date Range");
                    oToDateInput.setValueState(sap.ui.core.ValueState.Error);
                    oModel.setProperty("/bIsSelScreenInvalidate", true);
                } else {
                    oFromDateInput.setValueStateText("");
                    oFromDateInput.setValueState(sap.ui.core.ValueState.None);
                    oToDateInput.setValueStateText("");
                    oToDateInput.setValueState(sap.ui.core.ValueState.None);
                    oModel.setProperty("/bIsSelScreenInvalidate", false);
                }
            }
        },
        _fnReturnFilterparameter: function () {
            var oView = oController.getView();
            var oModel = oView.getModel("FieldMonSelModel");
            var aOrderStatus = oModel.getProperty("/OrderStatusSelected");

            // oView = oController.getView()

            // oView.byId("idcompletedOnDatePickerTo")
            // oView.byId("idcreatedOnDatePicker")
            // oView.byId("idcreatedOnDatePickerTo")
            // oView.byId("idbasicStartDatePicker")
            // oView.byId("idbasicStartDatePickerTo")

            var sCompletedOn = {
                From: oView.byId("idcompletedOnDatePicker").getValue() ? oView.byId("idcompletedOnDatePicker").getValue() : undefined,
                To: oView.byId("idcompletedOnDatePickerTo").getValue() ? oView.byId("idcompletedOnDatePickerTo").getValue() : undefined
            };
            //var aMainActivity = oView.byId("idmainActivity").getSelectedKeys();
            var sCreatedOn = {
                From: oView.byId("idcreatedOnDatePicker").getValue() ? oView.byId("idcreatedOnDatePicker").getValue() : undefined,
                To: oView.byId("idcreatedOnDatePickerTo").getValue() ? oView.byId("idcreatedOnDatePickerTo").getValue() : undefined
            };
            var sBasicStart = {
                From: oView.byId("idbasicStartDatePicker").getValue() ? oView.byId("idbasicStartDatePicker").getValue() : undefined,
                To: oView.byId("idbasicStartDatePickerTo").getValue() ? oView.byId("idbasicStartDatePickerTo").getValue() : undefined
            };
            var aPlannerGroup = oController._getTokens(oView.byId("idPlannerGroup"));
            var aWorkCenter = oController._getTokens(oView.byId("idWorkCenter"));
            var aFuncLoc = oModel.getProperty("/FunctionalLocation") ? [oModel.getProperty("/FunctionalLocation")] : ''; //oController.getView().byId("idFuncLoc").getValue() ? [oController.getView().byId("idFuncLoc").getValue()] : oController._getTokens(oView.byId("idFuncLoc"));
            //oController._getTokens(oView.byId("idFuncLoc"));
            var aSerOrder = oController._getTokens(oView.byId("idServiceOrder"));
            var aOrderType = oController._getTokens(oView.byId("idOrderType"));
            var bMobileWorkforce = oModel.getProperty("/oSelected/oFilter/bMobileWorkForce");
            var bOnlyOPconf = oModel.getProperty("/oSelected/oFilter/bOnlyOpConfield");
            var bShowOnlyMTank = oModel.getProperty("/oSelected/oFilter/bShowOnlyMeterTank");
            var sLayout = oModel.getProperty("/sLayout");
            var aOrderOperationStatus = oModel.getProperty("/OrderOperationStatusSelected");
            var aOperationStatus = oModel.getProperty("/OperationStatusSelected");
            var aMeterAction = oModel.getProperty("/MeterActionSelected");

            function createOrFilter(arr, field) {
                if (!arr || arr.length === 0) return null;
                var filters = arr.map(value => new Filter(field, FilterOperator.EQ, value));
                return new Filter(filters, false);
            }
            function createDatesFilter(Obj, oPath) {
                var filters;
                filters = new Filter({
                    filters: [
                        new Filter({
                            path: oPath.From,
                            operator: FilterOperator.GT,
                            value1: Obj.From
                        }),
                        new Filter({
                            path: oPath.To,
                            operator: FilterOperator.LT,
                            value1: Obj.To
                        })
                    ],
                    and: true
                })
                return filters;
            }

            var allFilters = [
                createOrFilter(aOrderStatus, "Status"),
                createOrFilter(aPlannerGroup, "Planner_Group"),
                createOrFilter(aWorkCenter, "WRKCNTR_ID"),
                createOrFilter(aFuncLoc, "Functional_Loc"),
                createOrFilter(aSerOrder, "ORDER_NO"),
                createOrFilter(aOrderType, "ORDER_TYPE"),
                createOrFilter([bMobileWorkforce], "MOB_WFORCE"),
                createOrFilter([bOnlyOPconf], "OPR_CONF"),
                createOrFilter([bShowOnlyMTank], "CTPT_M_TANK"),
                createOrFilter(aOrderOperationStatus, "OP_STATUS"),
                createOrFilter(aOperationStatus, "OdStatus"),
                createOrFilter(aMeterAction, "METER_ACTION")
            ].filter(f => f !== null);
            var Validatefunction = function (From, To) {
                From = oController._fngetDateFormat(From);
                To = oController._fngetDateFormat(To);
                var isValidateDates = true;
                // var dateRegex = /^\d{4}\-\d{2}\-\d{2}T\d{2}:\d{2}:\d{2}$/;
                var dateRegex = /^\d{4}\-\d{2}\-\d{2}$/;
                var isValidFrom = dateRegex.test(From);
                var isValidTo = dateRegex.test(To);
                if (!isValidFrom || !isValidTo) {
                    // Handle invalid date format
                    isValidateDates = false;
                }
                return isValidateDates;
            }
            if (Validatefunction(sCompletedOn.From, sCompletedOn.To)) {
                allFilters.push(createDatesFilter(sCompletedOn, { From: "FINISH_DT_FROM", To: "FINISH_DT_TO" }));
            }
            if (Validatefunction(sCreatedOn.From, sCreatedOn.To)) {
                allFilters.push(createDatesFilter(sCreatedOn, { From: "CREATED_ON_FROM", To: "CREATED_ON_TO" }));
            }
            if (Validatefunction(sBasicStart.From, sBasicStart.To)) {
                allFilters.push(createDatesFilter(sBasicStart, { From: "BASIC_START_DT_FROM", To: "BASIC_START_DT_TO" }));
            }
            return allFilters;
        },

        _fnOnChangeCompletedDate: function () {
            var oView = oController.getView();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sCompletedOnFrom");
            var sToDate = oModel.getProperty("/sCompletedOnTo");
            if (sToDate && !sFromDate) {
                sap.m.MessageToast.show("Please select 'From' date before selecting 'To' date.");
                oView.byId("idcompletedOnDatePicker").setValue("");
                oModel.setProperty("/sCompletedOnTo", "");
            } else if (sFromDate && sToDate && sFromDate > sToDate) {
                sap.m.MessageToast.show("From date cannot be greater than To date");
                oModel.setProperty("/sCompletedOnFrom", "");
                oModel.setProperty("/sCompletedOnTo", "");
            } else {
                // Proceed with the logic
            }
        },

        getRangeOfDates: function () {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sCreatedOnFrom");
            var sToDate = oModel.getProperty("/sCreatedOnTo");
            if (sFromDate && sToDate) {
                var oFilter = new sap.ui.model.Filter("CreatedOn", sap.ui.model.FilterOperator.BT, sFromDate, sToDate);
                return [oFilter];
            } else if (sFromDate && !sToDate) {
                var oFilter = new sap.ui.model.Filter("CreatedOn", sap.ui.model.FilterOperator.EQ, sFromDate);
                return [oFilter];
            }
            return [];
        },

        _fnOnChangeCreatedOn: function () {
            var oView = oController.getView();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sCreatedOnFrom");
            var sToDate = oModel.getProperty("/sCreatedOnTo");
            if (sToDate && !sFromDate) {
                sap.m.MessageToast.show("Please select 'From' date before selecting 'To' date.");
                oView.byId("idcreatedOnDatePicker").setValue("");
                oModel.setProperty("/sCreatedOnTo", "");
            } else if (sFromDate && sToDate && sFromDate > sToDate) {
                sap.m.MessageToast.show("From date cannot be greater than To date");
                oModel.setProperty("/sCreatedOnFrom", "");
                oModel.setProperty("/sCreatedOnTo", "");
            } else {
                // Proceed with the logic
            }
        },

        _fnOnChangeStartDate: function () {
            var oView = oController.getView();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sBasicStartFrom");
            var sToDate = oModel.getProperty("/sBasicStartTo");
            if (sToDate && !sFromDate) {
                sap.m.MessageToast.show("Please select 'From' date before selecting 'To' date.");
                oView.byId("idbasicStartDatePicker").setValue("");
                oModel.setProperty("/sBasicStartTo", "");
            } else if (sFromDate && sToDate && sFromDate > sToDate) {
                sap.m.MessageToast.show("From date cannot be greater than To date");
                oModel.setProperty("/sBasicStartFrom", "");
                oModel.setProperty("/sBasicStartTo", "");
            } else {
                // Proceed with the logic
            }
        },
        _fngetDateFormat: function (strDate) {

            var oDateFormat = DateFormat.getInstance({
                UTC: false,
                pattern: "YYYY-MM-dd"
            });
            var formatDate = oDateFormat.format(new Date(strDate));
            return formatDate.toString();
        },
        onWorkCenterSuggestionItemPress: function (oEvent) {
           // debugger;
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oMultiInput = oController.getView().byId("idWorkCenter");
            var oSelectedItem = oEvent.getParameter("selectedRow");

            var oSelectedCells = oSelectedItem.getCells();
            var aToken = new Token({
                key: oSelectedCells[1].getText(),
                text: oSelectedCells[0].getText()
            });

            oMultiInput.addToken(aToken);
            oMultiInput.setValue("");

            var aTokens = oMultiInput.getTokens();
            oModel.setProperty("/oSelected/WorkCenter", []);
            var aSelectedKeys = oModel.getProperty("/oSelected/WorkCenter");
            aTokens.forEach(function (oToken) {
                var sKey = oToken.getKey();
                var sText = oToken.getText();
                if (!aSelectedKeys.includes(sKey)) {
                    aSelectedKeys.push({ "key": sKey, "text": sText });
                    //aSelectedKeys.push(sKey);
                }
            });
            oModel.setProperty("/oSelected/WorkCenter", aSelectedKeys);

        },
        onPlannerGroupSuggestionItems: function (oEvent) {
            //debugger;
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oMultiInput = oController.getView().byId("idPlannerGroup");
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oSelectedCells = oSelectedItem.getCells();
            var aToken = new Token({
                key: oSelectedCells[1].getText(),
                text: oSelectedCells[0].getText()
            });

            oMultiInput.addToken(aToken);
            oMultiInput.setValue("");

            var aTokens = oMultiInput.getTokens();
            oModel.setProperty("/oSelected/PlannerGroup", []);
            var aSelectedKeys = oModel.getProperty("/oSelected/PlannerGroup");
            aTokens.forEach(function (oToken) {
                var sKey = oToken.getKey();
                var sText = oToken.getText();
                if (!aSelectedKeys.includes(sKey)) {
                    aSelectedKeys.push({ "key": sKey, "text": sText });
                    //aSelectedKeys.push(sKey);
                }
            });
            oModel.setProperty("/oSelected/PlannerGroup", aSelectedKeys);

        },
        onOrderSuggestionItemPress: function (oEvent) {
            //debugger;
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idServiceOrder");
            var oSelectedCells = oSelectedItem.getCells();
            var aToken = new Token({
                key: oSelectedCells[1].getText(),
                text: oSelectedCells[0].getText()
            });

            oMultiInput.addToken(aToken);
            oMultiInput.setValue("");

            var aTokens = oMultiInput.getTokens();
            oModel.setProperty("/oSelected/ServiceOrder", []);
            var aSelectedKeys = oModel.getProperty("/oSelected/ServiceOrder");
            aTokens.forEach(function (oToken) {
                var sKey = oToken.getKey();
                var sText = oToken.getText();
                if (!aSelectedKeys.includes(sKey)) {
                    aSelectedKeys.push({ "key": sKey, "text": sText });
                    //aSelectedKeys.push(sKey);
                }
            });
            oModel.setProperty("/oSelected/ServiceOrder", aSelectedKeys);
        },
        onOrderTypeSuggestionItemPress: function (oEvent) {
            //debugger;
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idOrderType");
            var oSelectedCells = oSelectedItem.getCells();
            var aToken = new Token({
                key: oSelectedCells[1].getText(),
                text: oSelectedCells[0].getText()
            });

            oMultiInput.addToken(aToken);
            oMultiInput.setValue("");

            var aTokens = oMultiInput.getTokens();
            oModel.setProperty("/oSelected/OrderType", []);
            var aSelectedKeys = oModel.getProperty("/oSelected/OrderType");
            aTokens.forEach(function (oToken) {
                var sKey = oToken.getKey();
                var sText = oToken.getText();
                if (!aSelectedKeys.includes(sKey)) {
                    aSelectedKeys.push({ "key": sKey, "text": sText });
                    //aSelectedKeys.push(sKey);
                }
            });
            oModel.setProperty("/oSelected/OrderType", aSelectedKeys);
        },

        //************************** Token Update functions **********************
        onWorkCenterTokenUpdate: function (oEvent) {
            //debugger;
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oMultiInput = oController.getView().byId("idWorkCenter");
            var sAction = oEvent.getParameter("type");
            var oToken = oEvent.getParameters().removedTokens[0].getKey();
            var aTokens = oMultiInput.getTokens();

            var aTokenData = [], aSelectedData = [];
            if (sAction === "removed") {
                aTokenData = aTokens.filter(function (token) {
                    return token.getKey() !== oToken;
                });
            }
            for (var i = 0; i < aTokenData.length; i++) {
                aSelectedData.push({ "key": aTokenData[i].getKey(), "text": aTokenData[i].getText() });
            }

            oModel.setProperty("/oSelected/WorkCenter", aSelectedData);
        },
        onPlannerGroupTokenUpdate: function (oEvent) {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oMultiInput = oController.getView().byId("idPlannerGroup");
            var sAction = oEvent.getParameter("type");
            var oToken = oEvent.getParameters().removedTokens[0].getKey();
            var aTokens = oMultiInput.getTokens();

            var aTokenData = [], aSelectedData = [];
            if (sAction === "removed") {
                aTokenData = aTokens.filter(function (token) {
                    return token.getKey() !== oToken;
                });
            }
            for (var i = 0; i < aTokenData.length; i++) {
                aSelectedData.push({ "key": aTokenData[i].getKey(), "text": aTokenData[i].getText() });
            }

            oModel.setProperty("/oSelected/PlannerGroup", aSelectedData);
        },
        onOrderNoTokenUpdate: function (oEvent) {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oMultiInput = oController.getView().byId("idServiceOrder");
            var sAction = oEvent.getParameter("type");
            var oToken = oEvent.getParameters().removedTokens[0].getKey();
            var aTokens = oMultiInput.getTokens();

            var aTokenData = [], aSelectedData = [];
            if (sAction === "removed") {
                aTokenData = aTokens.filter(function (token) {
                    return token.getKey() !== oToken;
                });
            }
            for (var i = 0; i < aTokenData.length; i++) {
                aSelectedData.push({ "key": aTokenData[i].getKey(), "text": aTokenData[i].getText() });
            }

            oModel.setProperty("/oSelected/ServiceOrder", aSelectedData);
        },
        onOrderTypeTokenUpdate: function (oEvent) {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var oMultiInput = oController.getView().byId("idOrderType");
            var sAction = oEvent.getParameter("type");
            var oToken = oEvent.getParameters().removedTokens[0].getKey();
            var aTokens = oMultiInput.getTokens();

            var aTokenData = [], aSelectedData = [];
            if (sAction === "removed") {
                aTokenData = aTokens.filter(function (token) {
                    return token.getKey() !== oToken;
                });
            }
            for (var i = 0; i < aTokenData.length; i++) {
                aSelectedData.push({ "key": aTokenData[i].getKey(), "text": aTokenData[i].getText() });
            }

            oModel.setProperty("/oSelected/OrderType", aSelectedData);
        }
    });
});
