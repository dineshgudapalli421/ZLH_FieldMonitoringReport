sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    "sap/m/PDFViewer",
    'sap/ui/core/Fragment',
    'sap/ui/model/Sorter',
    'sap/m/p13n/Engine',
    'sap/m/p13n/SelectionController',
    'sap/m/p13n/SortController',
    'sap/m/p13n/GroupController',
    'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library',
    "sap/ushell/services/Personalization"
  ],
  function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token, PDFViewer, Fragment, Sorter, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, CoreLibrary, Personalization) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oOEBoDataModel, oResourceBundle, UIComponent, oSelectionFilter;
    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.FieldMonList", {
      onInit: function () {
        debugger;
        oController = this;
        UIComponent = oController.getOwnerComponent();
        oOEBoDataModel = oController.getOwnerComponent().getModel();
        oRouter = UIComponent.getRouter();
        oController._oTableFieldMon = oController.getView().byId("idFieldMonTable");
        oController._oP13nEngineFieldMon = Engine.getInstance();
        oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        oRouter.getRoute("FieldMonList").attachPatternMatched(oController._onRouteMatch, oController);
        oController._mViewSettingsDialogs = {};
        oController._initializeVariantManagement();
        oController._registerForP13n();
      },
      _initializeVariantManagement: function () {
        debugger;
        var oView = this.getView();
        var oVariantManagement = oView.byId("idVManagement");
        sap.ushell.Container.getServiceAsync("Personalization").then(function (oPersonalizationService) {
          var oPersId = {
            container: "MyGridTableVariants",
            item: "tableVariants"
          };
          oPersonalizationService.getContainer(oPersId.container).then(function (oContainer) {
            this._oContainer = oContainer;
            var oVariantSet = oContainer.getItemValue(oPersId.item) || { variants: [], defaultVariant: "" };
            this._loadVariants(oVariantSet);

            oVariantManagement.setModel(new JSONModel(oVariantSet.variants), "variantItems");
            oVariantManagement.setDefaultVariantKey(oVariantSet.defaultVariant, '');

            this._applyVariant(oVariantSet.defaultVariant, '');
          }.bind(this)).catch(function (oError) {
            MessageToast.show("Error Loading Personalization Container:" + oError.message);
          });
        }.bind(this)).catch(function (oError) {
          MessageToast.show("Error accessing personalization service: " + oError.message);
        });
      },

      _loadVariants: function (oVariantSet) {
        debugger;
        var oVM = oController.getView().byId("idVManagement");
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
      _applyVariant: function (sVariantKey, sName) {
        debugger;
        var oTable = oController.getView().byId("idFieldMonTable");
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
        var oVariantData = {};
        if (oVariant) {
          oVariantData = oVariant.data;
        }
        var aColumns = oTable.getColumns();
        aColumns.forEach(function (oColumn) {
          var oColumnData = oVariantData.columns ? oVariantData.columns.find(function (col) {
            return col.id === oColumn.getId();
          }) : null;
          if (oColumnData) {
            oColumn.setVisible(oColumnData.visible);
            oColumn.setWidth(oColumnData.width || "");
            if (oColumnData.sorted) {
              oColumn.getSorted(true);
              oColumn.setSortOrder(oColumnData.sortOrder);
            } else {
              oColumn.setSorted(false);
            }
          } else {
            oColumn.setVisible(true);
            oColumn.setSorted(false);
          }
        });
      },
      onSelectVariant: function (oEvent) {
        debugger;
        var oTable = oController.getView().byId("idFieldMonTable");
        var sVariantKey = oEvent.getParameter("key");
        var objVariant = {}, objVariantItems = [], oName = '';
        objVariant = oEvent.getSource().oContext.getModel().getData();
        objVariantItems = objVariant["FieldMonList--idVManagement"].variants;

        for (var i = 0; i < objVariantItems.length; i++) {
          if (sVariantKey === objVariantItems[i].key) {
            oName = objVariantItems[i].title;
          }
        }
        if (sVariantKey === 'FieldMonList--idVManagement') {
          oController._registerForP13n();
          oController.onRefreshSoResults();
          var aColumns = oTable.getColumns();
          aColumns.forEach(function (oColumn) {
            oColumn.setVisible(true);
          });
        }
        else {
          oController.onRefreshSoResults();
          this._applyVariant(sVariantKey, oName);
        }


      },
      onSaveVariant: function (oEvent) {
        debugger;
        var oParameters = oEvent.getParameters();
        var sVariantKey = oParameters.key || Date.now().toString();
        var sVariantText = oParameters.name;
        var bOverwrite = oParameters.overwrite;
        var bDefault = oParameters.def;
        //var oVariantData = oController.getView().getModel("FieldMonSelModel").getData();

        var oVariantData = oController._getTablePersonalizationData();
        var oVariantSet = this._oContainer.getItemValue("variantSet") || { "variants": [], defaultVariant: "" }
        var oVariantManagement = oController.getView().byId("idVManagement");
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
      onManageVariant: function (oEvent) {
        debugger;
        var objVariant = {}, objVariantItems = [], oName = '';
        objVariant = oEvent.getSource().oContext.getModel().getData();
        objVariantItems = objVariant["FieldMonList--idVManagement"].variants;

        var oParameters = oEvent.getParameters();
        var aRenamed = oEvent.getParameter("renamed");
        var aDeleted = oEvent.getParameter("deleted");
        var oVariantSet = this._oContainer.getItemValue("variantSet") || { variants: [] };
        if (aDeleted !== undefined) {
          oParameters.deleted.forEach(function (sKey) {
            debugger;
            for (var i = 0; i < objVariantItems.length; i++) {
              if (sKey !== objVariantItems[i].key) {
                oName = objVariantItems[i].title;
                oVariantSet.variants = oVariantSet.variants.filter(function (v) {
                  return v.text === oName;
                });
              }
            }
          });
          //oController._registerForP13n();
          oController.onRefreshSoResults();
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
          oController.getView().byId("idVManagement").setDefaultVariantKey(oParameters.def);
        }
        this._oContainer.setItemValue("variantSet", oVariantSet);
        this._oContainer.save().then(function () {
          MessageToast.show("Variants managed successfully!");
        }).catch(function (oError) {
          MessageToast.show("Error managing variants:" + oError.message);
        });

      },
      _getTablePersonalizationData: function () {
        var oTable = oController.getView().byId("idFieldMonTable");
        var aColumns = oTable.getColumns();
        var aVisibleColumns = [];

        aColumns.forEach(function (oColumn) {
          aVisibleColumns.push({
            id: oColumn.getId(),
            visible: oColumn.getVisible(),
            width: oColumn.getWidth(),
            sortProperty: oColumn.getSortProperty(),
            sorted: oColumn.getSorted(),
            sortOrder: oColumn.getSortOrder()
          });
        });
        return {
          columns: aVisibleColumns
        }
      },
      _registerForP13n: function () {
        debugger;
        const oTable = oController.getView().byId("idFieldMonTable");
        oController.oMetadataHelper = new MetadataHelper([{
          key: "Status_col",
          label: "Status",
          path: "Status"
        },
        {
          key: "Text_col",
          label: "Text",
          path: "TEXT"
        },
        {
          key: "Log_col",
          label: "Log",
          path: "Notification"
        },
        {
          key: "ActivityType_col",
          label: "Activity Type",
          path: "ACTIVITY_TYPE"
        },
        {
          key: "Order_col",
          label: "Order",
          path: "ORDER_NO"
        },
        {
          key: "Opcode_col",
          label: "Operation Code",
          path: "OpCode"
        },
        {
          key: "opDescription_col",
          label: "Operation Text",
          path: "OpDescription"
        },
        {
          key: "esa_col",
          label: "ESA",
          path: "ESA"
        },
        {
          key: "billable_col",
          label: "Billable",
          path: "BILLABLE"
        },
        {
          key: "opsNo_col",
          label: "Ops no",
          path: "OPS_NO"
        },
        {
          key: "opsDesc_col",
          label: "Ops Desc",
          path: "OPS_DESC"
        },
        {
          key: "anlage_col",
          label: "Installation",
          path: "Anlage"
        },
        {
          key: "billingClass_col",
          label: "Billing class",
          path: "BILLING_CLASS"
        },
        {
          key: "functionalLocation_col",
          label: "Functional Location",
          path: "Functional_Loc"
        },
        {
          key: "fieldCompletionDt_col",
          label: "Field Completion dt",
          path: "FIELD_COMP_DT"
        },
        {
          key: "address_col",
          label: "Address",
          path: "ADDRESS"
        },
        {
          key: "keyNo_col",
          label: "Key no",
          path: "KEY_NO"
        },
        {
          key: "meterNo_col",
          label: "Meter No",
          path: "METER_NO"
        },
        {
          key: "meterAction_col",
          label: "Meter Action",
          path: "METER_ACTION"
        },
        {
          key: "ctpt_col",
          label: "CT PT",
          path: "CTPT"
        },
        {
          key: "orderType_col",
          label: "OT",
          path: "OT"
        },
        {
          key: "activity_col",
          label: "Activity",
          path: "activity"
        },
        {
          key: "workCenterId_col",
          label: "WorkCenter Id",
          path: "WRKCNTR_ID"
        },
        {
          key: "wrkCntrDesc_col",
          label: "WrkCntr desc",
          path: "WRKCNTR_DESC"
        },
        {
          key: "descrepancy_col",
          label: "Discrepancy",
          path: "Descrepancy"
        },
        {
          key: "mainActivity_col",
          label: "Main Activity",
          path: "MAIN_ACTIVITY"
        },
        {
          key: "inLogStatus_col",
          label: "InLog Status",
          path: "InLog"
        },
        {
          key: "outLogException_col",
          label: "OutLog Exception",
          path: "OutLog"
        },
        {
          key: "newMeterLocation_col",
          label: "New Meter Location",
          path: "NEW_METER_LOC"
        },
        {
          key: "review_col",
          label: "Review",
          path: "REVIEW"
        },
        {
          key: "by_col",
          label: "By",
          path: "by"
        },
        {
          key: "on_col",
          label: "On",
          path: "on"
        },
        {
          key: "at_col",
          label: "At",
          path: "ON_TIME"
        },
        {
          key: "basicStartDt_col",
          label: "Basic start dt",
          path: "BASIC_START_DT_FROM"
        },
        {
          key: "finishDt_col",
          label: "Finish dt",
          path: "FINISH_DT_FROM"
        },
        {
          key: "mobileCompletionDt_col",
          label: "Mobile Completion dt",
          path: "MOBILE_COMPLETION_DT"
        },
        {
          key: "mobileCompletionTm_col",
          label: "Mobile Completion tm",
          path: "MOBILE_COMPLETION_TIME"
        },
        {
          key: "createdBy_col",
          label: "Created By",
          path: "CREATED_BY"
        },
        {
          key: "createdOn_col",
          label: "Created On",
          path: "CREATED_ON_FROM"
        },
        {
          key: "completedBy_col",
          label: "Completed By",
          path: "COMPLETED_BY"
        },
        {
          key: "plantSection_col",
          label: "Plant Section",
          path: "PLANT_SECTION"
        },
        {
          key: "fieldsNotes_col",
          label: "Fields Notes",
          path: "FIELDS_NOTES"
        },
        {
          key: "activityPerformed_col",
          label: "Activity Performed",
          path: "ACTIVITY_PERFORMED"
        },
        {
          key: "workArea_col",
          label: "Work Area",
          path: "WORK_AREA"
        },
        {
          key: "opStatus_col",
          label: "Operation Status",
          path: "OP_STATUS"
        }
        ]);

        oController._mIntialWidth = {
          "Status_col": "11rem",
          "Text_col": "11rem",
          "Log_col": "11rem",
          "ActivityType_col": "11rem",
          "Order_col": "11rem",
          "Opcode_col": "11rem",
          "opDescription_col": "11rem",
          "esa_col": "11rem",
          "billable_col": "11rem",
          "opsNo_col": "11rem",
          "opsDesc_col": "11rem",
          "anlage_col": "11rem",
          "billingClass_col": "11rem",
          "functionalLocation_col": "11rem",
          "fieldCompletionDt_col": "11rem",
          "address_col": "11rem",
          "keyNo_col": "11rem",
          "meterNo_col": "11rem",
          "meterAction_col": "11rem",
          "ctpt_col": "11rem",
          "orderType_col": "11rem",
          "activity_col": "11rem",
          "workCenterId_col": "11rem",
          "wrkCntrDesc_col": "11rem",
          "descrepancy_col": "11rem",
          "mainActivity_col": "11rem",
          "inLogStatus_col": "11rem",
          "outLogException_col": "11rem",
          "newMeterLocation_col": "11rem",
          "review_col": "11rem",
          "by_col": "11rem",
          "on_col": "11rem",
          "at_col": "11rem",
          "basicStartDt_col": "11rem",
          "finishDt_col": "11rem",
          "mobileCompletionDt_col": "11rem",
          "mobileCompletionTm_col": "11rem",
          "createdBy_col": "11rem",
          "createdOn_col": "11rem",
          "completedBy_col": "11rem",
          "plantSection_col": "11rem",
          "fieldsNotes_col": "11rem",
          "activityPerformed_col": "11rem",
          "workArea_col": "11rem",
          "opStatus_col": "11rem"
        };

        oController._oP13nEngineFieldMon.register(oTable, {
          helper: oController.oMetadataHelper,
          controller: {
            Columns: new SelectionController({
              targetAggregation: "columns",
              control: oTable
            }),
            Sorter: new SortController({
              control: oTable
            }),
            Groups: new GroupController({
              control: oTable
            }),
            ColumnWidth: new ColumnWidthController({
              control: oTable
            })
          }
        });

        oController._oP13nEngineFieldMon.attachStateChange(oController.handleStateChange.bind(oController));
      },
      onExit: function () {
        if (oController._oP13nEngineFieldMon) {
          oController._oP13nEngineFieldMon.destroy();
        }
      },
      handleStateChange: function (oEvent) {
        debugger;
        var oTable = oController.getView().byId("idFieldMonTable");
        var oState = oEvent.getParameter("state");

        if (!oState) {
          return;
        }

        oTable.getColumns().forEach(function (oColumn) {

          var sKey = oController._getKey(oColumn);
          var sColumnWidth = oState.ColumnWidth[sKey];

          oColumn.setWidth(sColumnWidth || oController._mIntialWidth[sKey]);

          oColumn.setVisible(false);
          oColumn.setSortOrder(CoreLibrary.SortOrder.None);
        }.bind(oController));

        oState.Columns.forEach(function (oProp, iIndex) {
          var oCol = this.byId(oProp.key);
          oCol.setVisible(true);

          oTable.removeColumn(oCol);
          oTable.insertColumn(oCol, iIndex);
        }.bind(oController));

        var aSorter = [];
        var aSorter = [];
        oState.Sorter.forEach(function (oSorter) {
          var oColumn = this.byId(oSorter.key);
          /** @deprecated As of version 1.120 */
          oColumn.setSorted(true);
          oColumn.setSortOrder(oSorter.descending ? CoreLibrary.SortOrder.Descending : CoreLibrary.SortOrder.Ascending);
          aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
        }.bind(this));
        oTable.getBinding("rows").sort(aSorter);
      },
      _getKey: function (oControl) {
        return this.getView().getLocalId(oControl.getId());
      },
      onSort: function (oEvent) {
        var oTable = oController.getView().byId("idFieldMonTable");
        var sAffectedProperty = oController._getKey(oEvent.getParameter("column"));
        var sSortOrder = oEvent.getParameter("sortOrder");

        //Apply the state programatically on sorting through the column menu
        //1) Retrieve the current personalization state
        oController._oP13nEngineFieldMon.retrieveState(oTable).then(function (oState) {

          //2) Modify the existing personalization state --> clear all sorters before
          oState.Sorter.forEach(function (oSorter) {
            oSorter.sorted = false;
          });
          oState.Sorter.push({
            key: sAffectedProperty,
            descending: sSortOrder === CoreLibrary.SortOrder.Descending
          });

          //3) Apply the modified personalization state to persist it in the VariantManagement
          oController._oP13nEngineFieldMon.applyState(oTable, oState);
        });
      },
      onColumnHeaderItemPress: function (oEvent) {
        var oTable = oController.getView().byId("idFieldMonTable");
        var sPanel = oEvent.getSource().getIcon().indexOf("sort") >= 0 ? "Sorter" : "Columns";

        oController._oP13nEngineFieldMon.show(oTable, [sPanel], {
          contentHeight: "35rem",
          contentWidth: "32rem",
          source: oTable
        });
      },
      onColumnMove: function (oEvent) {
        var oTable = oController.getView().byId("idFieldMonTable");
        var oAffectedColumn = oEvent.getParameter("column");
        var iNewPos = oEvent.getParameter("newPos");
        var sKey = oController._getKey(oAffectedColumn);
        oEvent.preventDefault();

        oController._oP13nEngineFieldMon.retrieveState(oTable).then(function (oState) {

          var oCol = oState.Columns.find(function (oColumn) {
            return oColumn.key === sKey;
          }) || {
            key: sKey
          };
          oCol.position = iNewPos;

          Engine.getInstance().applyState(oTable, {
            Columns: [oCol]
          });
        });
      },
      onColumnResize: function (oEvent) {
        var oColumn = oEvent.getParameter("column");
        var sWidth = oEvent.getParameter("width");
        var oTable = oController.getView().byId("idFieldMonTable");

        var oColumnState = {};
        oColumnState[oController._getKey(oColumn)] = sWidth;

        oController._oP13nEngineFieldMon.applyState(oTable, {
          ColumnWidth: oColumnState
        });
      },
      _onReceiveFilters: function (sChannel, sEvent, oData) {
        oSelectionFilter = oData.filters;
      },
      _onRouteMatch: function () {
        var oGlobalModel = oController.getOwnerComponent().getModel("GlobalFieldMonModel");
        var oList = oGlobalModel ? oGlobalModel.getProperty("/FiledMonList") : [];
        var oModel = new JSONModel({
          OEBReportList: [],
          bPageBusy: false,
          bDialogBusy: false,
          sSourceSOFORM: "",
          BPEMList: [],
          oUpdateCustomerConfirm: {
            sSiteReadiness: 'Y',
          },
          oMeterLoc: {
            sSelectedLoc: "S",
            sDesc: ""
          },
          SiteReadiness: {
            sSiteReadinessDate: new Date(),
            SiteRedinessDateError: 'None'
          },
          oSelectedOEB: {},
          Filterparameters: {
            Status: [],
            ORDER_NO: []
          }
        });
        oController.getView().setModel(oModel, "FieldMonitorModel");
        oController.getView().getModel("FieldMonitorModel").setProperty("/aFieldMonList", oList);
      },
      onRefreshSoResults: function () {
        debugger;
        var oGlobalModel = oController.getOwnerComponent().getModel("GlobalFieldMonModel");
        var oList = oGlobalModel ? oGlobalModel.getProperty("/FiledMonList") : [];
        var oModel = new JSONModel({
          OEBReportList: [],
          bPageBusy: false,
          bDialogBusy: false,
          sSourceSOFORM: "",
          BPEMList: [],
          oUpdateCustomerConfirm: {
            sSiteReadiness: 'Y',
          },
          oMeterLoc: {
            sSelectedLoc: "S",
            sDesc: ""
          },
          SiteReadiness: {
            sSiteReadinessDate: new Date(),
            SiteRedinessDateError: 'None'
          },
          oSelectedOEB: {},
          Filterparameters: {
            Status: [],
            ORDER_NO: []
          }
        });
        oController.getView().setModel(oModel, "FieldMonitorModel");
        oController.getView().getModel("FieldMonitorModel").setProperty("/aFieldMonList", oList);
        oController.getView().byId("idFieldMonTable").getModel().refresh(true);
      },
      onPressSoResults: function () {
        debugger;
        var oTable = oController.getView().byId("idFieldMonTable");
        var aSelectedIndices = oTable.getSelectedIndices();
        var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
        if (aSelectedRows.length) {
          oRouter.navTo("SOForm", {
            OrderID: aSelectedRows[0].ORDER_NO
            // OPSNo: aSelectedRows[0].OPS_NO
            // "?query": {
            //   OpCode: aSelectedRows[0].OpCode
            // }
          });
        } else {
          MessageToast.show(oResourceBundle.getText("selectLineItemMessage"));
        }
      },
      onSubmitFieldMonList: function () {
        var oView = oController.getView();
        var oModel = oView.getModel("FieldMonitorModel");
        var oList = oModel.getProperty("/aFieldMonList");
        oModel.setProperty("/bPageBusy", true);
        var oValidatedList = oList.filter(oValue => oValue.REVIEW === true && oValue.REVIEW_EDITABLE === true);
        if (oValidatedList.length) {
          var oPayload = {
            "FLAG": "X",
            "Dummy_review_Entity01": oValidatedList.map(function (oValue) {
              return {
                "OrderId": oValue.ORDER_NO,
                "OrderType": oValue.OT,
                "Description": ""//oValue.DESCRIPTION
              };
            })
          };
          oOEBoDataModel.create("/Dummy_review_EntitySet", oPayload, {
            success: function (data) {
              oModel.setProperty("/bPageBusy", false);
              MessageBox.success(oResourceBundle.getText("ordersReviewedMessage"));
              oList.forEach(function (oListItem) {
                if (oValidatedList.some(function (oValidatedItem) {
                  return oValidatedItem.ORDER_NO === oListItem.ORDER_NO;
                })) {
                  oListItem.REVIEW_EDITABLE = false;
                }
              });
              oModel.setProperty("/aFieldMonList", oList);
              oController._fnRefreshFieldMonList();
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
        } else {
          MessageToast.show(oResourceBundle.getText("checkReviewMessage"));
        }
      },
      _fnRefreshFieldMonList: function () {
        var oModel = UIComponent.getModel("GlobalFieldMonModel");
        var aFilter = oModel.getProperty("/SelParameters");
        if (aFilter.length) {
          oController._fnRefreshFieldMon(aFilter);
        }
      },
      _fnRefreshFieldMon: function (aFilter) {
        var oView = oController.getView();
        var oModel = oView.getModel("FieldMonitorModel");
        var sPath = "/Monitoring_FiledWorkSet";
        oModel.setProperty("/bPageBusy", true);
        var oFieldMonDataModel = oController.getOwnerComponent().getModel();
        oFieldMonDataModel.read(sPath, {
          filters: aFilter,
          success: function (oData) {
            var oResults = oData.results;
            if (oResults.length) {
              UIComponent.getModel("GlobalFieldMonModel").setProperty("/FiledMonList", oResults);
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
      getSelectedOrderNumber() {
        var oTable = oController.getView().byId("idFieldMonTable");
        var aSelectedIndices = oTable.getSelectedIndices();
        var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
        var OrderNumber = aSelectedRows[0]?.ORDER_NO;
        return OrderNumber;
      },
      onPressSoForms: function (oEvent) {
        var sOrderNumber = oController.getSelectedOrderNumber();
        if (!!sOrderNumber) {
          var oSource = "/sap/opu/odata/SAP/ZWM_FIELD_COMP_WORK_SRV/SOFormSet('" + sOrderNumber + "')/$value";
          // this.getView().getModel("FieldMonitorModel").setProperty("/sSourceSOFORM", oSource);
          // if (!this.oSoFormDialog) {
          //   this.oSoFormDialog = sap.ui.xmlfragment("com.sap.lh.cs.zlhfieldmonitoring.fragment.SOForm.SOFormPDF", this);
          //   this.getView().addDependent(this.oSoFormDialog);
          // }
          // this.oSoFormDialog.open();
          var oPdfViewer = new PDFViewer({
            title: "PDF View",
            height: "600px"
          });
          oPdfViewer.setSource(oSource);
          oPdfViewer.open();
        } else {
          MessageToast.show(oResourceBundle.getText("selectLineItemMessage"));
        }
      },
      onCloseDialogPDF: function () {
        this.oSoFormDialog.close();
      },
      handleSortButtonPressed: function () {
        this.getViewSettingsDialog("com.sap.lh.cs.zlhfieldmonitoring.fragment.Filters.SortDialog")
          .then(function (oViewSettingsDialog) {
            oViewSettingsDialog.open();
          });
      },

      handleFilterButtonPressed: function () {
        oController._FilterValuecollect();
        this.getViewSettingsDialog("com.sap.lh.cs.zlhfieldmonitoring.fragment.Filters.FilterDialog")
          .then(function (oViewSettingsDialog) {
            // oViewSettingsDialog.setModel();
            // oViewSettingsDialog.setModel("FieldMonitorModel", new JSONModel());
            oViewSettingsDialog.open();
          });

      },
      handleFilterDialogConfirm: function (oEvent) {
        var oTable = oController.getView().byId("idFieldMonTable"),
          mParams = oEvent.getParameters(),
          oBinding = oTable.getBinding("items"),
          aFilters = [];

        mParams.filterItems.forEach(function (oItem) {
          var aSplit = oItem.getKey().split("___"),
            sPath = aSplit[0],
            sOperator = aSplit[1],
            sValue1 = aSplit[2],
            sValue2 = aSplit[3],
            oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
          aFilters.push(oFilter);
        });

        // apply filter settings
        oBinding.filter(aFilters);

        // update filter bar
        this.byId("vsdFilterBar").setVisible(aFilters.length > 0);
        this.byId("vsdFilterLabel").setText(mParams.filterString);
      },
      // _FilterValuecollect: function () {
      // debugger;
      // var oTable = oController.getView().byId("idFieldMonTable");
      // oBinding = oTable.getBinding("rows");
      _FilterValuecollect: function () {
        debugger;
        var oTable = oController.getView().byId("idFieldMonTable");
        var oBinding = oTable.getBinding("rows");
        var aStatusValues = oBinding.getCurrentContexts().map(function (oContext) {
          return oContext.getProperty("Status");
        });
        // var aStatusValues = oBinding.getCurrentContexts().map(function (oContext) {
        //return aStatusValues;
        // var oFitlerItems = {

        // }
         oController.getView().getModel("FieldMonitorModel").setProperty("/Filterparameters/Status", aStatusValues)
        // >/Filterparameters/Status
        // aStatusValues
        // console.log(aStatusValues);
      },
      // debugger;
      // },
      getViewSettingsDialog: function (sDialogFragmentName) {
        var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

        if (!pDialog) {
          pDialog = Fragment.load({
            id: this.getView().getId(),
            name: sDialogFragmentName,
            controller: this
          }).then(function (oDialog) {
            // if (Device.system.desktop) {
            //   oDialog.addStyleClass("sapUiSizeCompact");
            // }
            return oDialog;
          });
          oController._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
        }
        return pDialog;
      },
      handleSortDialogConfirm: function (oEvent) {
        var oTable = oController.getView().byId("idFieldMonTable"),
          mParams = oEvent.getParameters(),
          oBinding = oTable.getBinding("rows"),
          sPath,
          bDescending,
          aSorters = [];

        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
        aSorters.push(new Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
      },

      async onPressBPEM() {
        var sOrderNumber = oController.getSelectedOrderNumber();
        if (!!sOrderNumber) {
          oController.oDialog ??= await this.loadFragment({
            name: "com.sap.lh.cs.zlhfieldmonitoring.fragment.BPEM.BPEMList"
          });
          oController.oDialog.open();
          var sSelctedOrderId = sOrderNumber; //'000004000272'; // 
          var aFitler = [new Filter("OrderId", FilterOperator.EQ, sSelctedOrderId)];
          oOEBoDataModel.read("/BPEM_CASESet", {
            filters: aFitler,
            success: function (oData, oRes) {
              oController.getView().getModel("FieldMonitorModel").setProperty("/BPEMList", oData.results)
            }, error: function (oError) {
              debugger;
            }
          })
        }
      },
      onPressCaseId: function (oEvent) {
        var oSource = oEvent.getSource();
        debugger;
        var navigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
        var hash = (navigationService && navigationService.hrefForExternal({
          target: { semanticObject: "UtilitiesClarificationCase", action: "displayClarificationCase" },
          params: {
            BPEMCase: oSource.getText()
          }
        })) || "";

        var url = window.location.href.split('#')[0] + hash;
        sap.m.URLHelper.redirect(url, true);
        // var target = {
        //   target: { semanticObject: "UtilitiesClarificationCase", action: "displayClarificationCase" },
        //   params: {
        //     BPEMCase: oSource.getText()
        //   }
        // };
        // navigationService.navigate(target, oController.getOwnerComponent());
      },
      handleLinkPress: function (oEvent) {
        var oSource = oEvent.getSource();
        let oOrderNo = oSource.getText();
        if (oOrderNo) {
          var navigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
          var hash = (navigationService && navigationService.hrefForExternal({
            target: { semanticObject: "MaintenanceOrder", action: "change" },
            params: {
              "AUFNR": oOrderNo,
              "sap-app-origin-hint": '',
              "sap-ui-tech-hint": "GUI",
              "sap-ushell-navmode": "inplace"
            }
          })) || "";

          var url = window.location.href.split('#')[0] + hash;
          sap.m.URLHelper.redirect(url, true);
          // var oTarget = {
          //     target: { semanticObject: "MaintenanceOrder", action: "change" },
          //     params: {
          //         "AUFNR": oOrderNo,
          //         "sap-app-origin-hint": '',
          //         "sap-ui-tech-hint": "GUI",
          //         "sap-ushell-navmode": "inplace"
          //     }
          // }
          // oCrossAppNav.navigate(oTarget, oController.getOwnerComponent());
        }
        console.log(oData);
      },
      _closeDialog: function () {
        oController.oDialog.close();
      },
      handleSettingsButtonPressed: function (oEvent) {
        const oTable = oController.getView().byId("idFieldMonTable");

        oController._oP13nEngineFieldMon.show(oTable, ["Columns", "Sorter"], {
          contentHeight: "35rem",
          contentWidth: "32rem",
          source: oEvent.getSource()
        });
      }
    });
  }
);
