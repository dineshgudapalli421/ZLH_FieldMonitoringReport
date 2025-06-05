sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    'sap/ui/core/Fragment',
    'sap/ui/model/Sorter',
    'sap/m/p13n/Engine',
    'sap/m/p13n/SelectionController',
    'sap/m/p13n/SortController',
    'sap/m/p13n/GroupController',
    'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library'
  ],
  function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token, Fragment, Sorter, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, CoreLibrary) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oOEBoDataModel, oResourceBundle, UIComponent, oSelectionFilter;
    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.FieldMonList", {
      onInit: function () {
        oController = this;
        UIComponent = oController.getOwnerComponent();
        oOEBoDataModel = oController.getOwnerComponent().getModel();
        oRouter = UIComponent.getRouter();
        oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        oRouter.getRoute("FieldMonList").attachPatternMatched(oController._onRouteMatch, oController);
        oController._mViewSettingsDialogs = {};
        // var oBus = sap.ui.getCore().getEventBus();
        // oBus.subscribe("filterChannel", "passFilters", oController._onReceiveFilters, oController);
        // var oTable = oController.byId("idFieldMonTable");
        // oController._oTablePersoController = new sap.ui.table.TablePersoController({
        //   table : oTable,
        //   persoService: SettingsService,
        //   hasGrouping: false
        // }).activate();
        oController._registerForP13n();
      },
      _registerForP13n: function () {
        debugger;
        const oTable = oController.byId("idFieldMonTable");
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
          label: "Descrepancy",
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

        Engine.getInstance().register(oTable, {
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

        Engine.getInstance().attachStateChange(oController.handleStateChange.bind(oController));
      },
      handleStateChange: function (oEvent) {
        debugger;
        const oTable = oController.byId("idFieldMonTable");
        const oState = oEvent.getParameter("state");

        if (!oState) {
          return;
        }

        oTable.getColumns().forEach(function (oColumn) {

          const sKey = oController._getKey(oColumn);
          const sColumnWidth = oState.ColumnWidth[sKey];

          oColumn.setWidth(sColumnWidth || oController._mIntialWidth[sKey]);

          oColumn.setVisible(false);
          oColumn.setSortOrder(CoreLibrary.SortOrder.None);
        }.bind(oController));

        oState.Columns.forEach(function (oProp, iIndex) {
          const oCol = oController.byId("idFieldMonTable").getColumns().find((oColumn) => oColumn.data("p13nKey") === oProp.key);
          oCol.setVisible(true);

          oTable.removeColumn(oCol);
          oTable.insertColumn(oCol, iIndex);
        }.bind(oController));

        const aSorter = [];
        oState.Sorter.forEach(function (oSorter) {
          const oColumn = oController.byId("idFieldMonTable").getColumns().find((oColumn) => oColumn.data("p13nKey") === oSorter.key);
          /** @deprecated As of version 1.120 */
          oColumn.setSorted(true);
          oColumn.setSortOrder(oSorter.descending ? CoreLibrary.SortOrder.Descending : CoreLibrary.SortOrder.Ascending);
          aSorter.push(new Sorter(oController.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
        }.bind(oController));
        oTable.getBinding("rows").sort(aSorter);
      },
      _getKey: function (oControl) {
        return oControl.data("p13nKey");
      },
      onSort: function (oEvent) {
        const oTable = oController.byId("idFieldMonTable");
        const sAffectedProperty = oController._getKey(oEvent.getParameter("column"));
        const sSortOrder = oEvent.getParameter("sortOrder");

        //Apply the state programatically on sorting through the column menu
        //1) Retrieve the current personalization state
        Engine.getInstance().retrieveState(oTable).then(function (oState) {

          //2) Modify the existing personalization state --> clear all sorters before
          oState.Sorter.forEach(function (oSorter) {
            oSorter.sorted = false;
          });
          oState.Sorter.push({
            key: sAffectedProperty,
            descending: sSortOrder === CoreLibrary.SortOrder.Descending
          });

          //3) Apply the modified personalization state to persist it in the VariantManagement
          Engine.getInstance().applyState(oTable, oState);
        });
      },
      onColumnHeaderItemPress: function (oEvent) {
        const oTable = oController.byId("idFieldMonTable");
        const sPanel = oEvent.getSource().getIcon().indexOf("sort") >= 0 ? "Sorter" : "Columns";

        Engine.getInstance().show(oTable, [sPanel], {
          contentHeight: "35rem",
          contentWidth: "32rem",
          source: oTable
        });
      },
      onColumnMove: function (oEvent) {
        const oTable = oController.byId("idFieldMonTable");
        const oAffectedColumn = oEvent.getParameter("column");
        const iNewPos = oEvent.getParameter("newPos");
        const sKey = oController._getKey(oAffectedColumn);
        oEvent.preventDefault();

        Engine.getInstance().retrieveState(oTable).then(function (oState) {

          const oCol = oState.Columns.find(function (oColumn) {
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
        const oColumn = oEvent.getParameter("column");
        const sWidth = oEvent.getParameter("width");
        const oTable = oController.byId("idFieldMonTable");

        const oColumnState = {};
        oColumnState[oController._getKey(oColumn)] = sWidth;

        Engine.getInstance().applyState(oTable, {
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
        var oTable = oController.getView().byId("idFieldMonTable");
        var aSelectedIndices = oTable.getSelectedIndices();
        var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
        if (aSelectedRows.length) {
          oRouter.navTo("SOForm", {
            OrderID: aSelectedRows[0].ORDER_NO
          });
        } else {
          MessageToast.show(oResourceBundle.getText("selectLineItemMessage"));
        }
      },
      // onPressSoForms: function () {
      //   var oTable = oController.getView().byId("idFieldMonTable");
      //   var aSelectedIndices = oTable.getSelectedIndices();
      //   var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
      //   var OrderNumber = aSelectedRows[0].ORDER_NO;//'1000021';
      //   if (!this.oSoFormDialog) {
      //     this.oSoFormDialog = new sap.m.Dialog({
      //       title: oResourceBundle.getText("soFormTitle"),
      //       content: new sap.m.PDFViewer({
      //         source: `/sap/opu/odata/SAP/ZWM_FIELD_COMP_WORK_SRV/SOFormSet('${OrderNumber}')/$value`
      //       }),
      //       buttons: [
      //         new sap.m.Button({
      //           text: oResourceBundle.getText("closeButton"),
      //           type: "Reject",
      //           press: function () {
      //             this.oSoFormDialog.close();
      //           }.bind(this)
      //         })
      //       ]
      //     });
      //     this.getView().addDependent(this.oSoFormDialog);
      //   }
      //   this.oSoFormDialog.open();
      // },
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
      onPressSoForms: function (oEvent, letterId) {
        var sOrderNumber = oController.getSelectedOrderNumber();
        if (!!sOrderNumber) {
          var oSource = "/sap/opu/odata/SAP/ZWM_FIELD_COMP_WORK_SRV/SOFormSet('" + sOrderNumber + "')/$value";
          this.getView().getModel("FieldMonitorModel").setProperty("/sSourceSOFORM", oSource);
          if (!this.oSoFormDialog) {
            this.oSoFormDialog = sap.ui.xmlfragment("com.sap.lh.cs.zlhfieldmonitoring.fragment.SOForm.SOFormPDF", this);
            this.getView().addDependent(this.oSoFormDialog);
          }
          this.oSoFormDialog.open();
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
            // oViewSettingsDialog.setModel("FieldMonitorModel", new JSONModel();)
            oViewSettingsDialog.open();
          });

      },
      // _FilterValuecollect: function () {
      // debugger;
      // var oTable = oController.getView().byId("idFieldMonTable");
      // oBinding = oTable.getBinding("rows");
      _FilterValuecollect: function () {
        var oTable = oController.getView().byId("idFieldMonTable");
        var oBinding = oTable.getBinding("rows");
        var aStatusValues = oBinding.getCurrentContexts().map(function (oContext) {
          return oContext.getProperty("Status");
        });
        // var aStatusValues = oBinding.getCurrentContexts().map(function (oContext) {
        return aStatusValues;
        // var oFitlerItems = {

        // }
        // oController.getView().getModel("FieldMonitorModel").setProperty("/Filterparameters/Status", aStatusValues)
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
        const oTable = oController.byId("idFieldMonTable");

        Engine.getInstance().show(oTable, ["Columns"], {
          contentHeight: "35rem",
          contentWidth: "32rem",
          source: oEvent.getSource()
        });
      },

    });
  }
);
