sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    'sap/ui/model/Sorter',
    'sap/m/P13nDialog',
    'sap/m/P13nColumnsPanel',
    'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library',
    "sap/ushell/services/Personalization"
  ],
  function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token, Sorter, P13nDialog, P13nColumnsPanel, MetadataHelper, ColumnWidthController, CoreLibrary, Personalization) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oOEBoDataModel, oResourceBundle, UIComponent;
    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.SOForm", {
      onInit: function () {
        oController = this;
        UIComponent = oController.getOwnerComponent();
        oOEBoDataModel = oController.getOwnerComponent().getModel();
        oRouter = UIComponent.getRouter();
        oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        oRouter.getRoute("SOForm").attachPatternMatched(oController._onRouteMatch, oController);
        var oCTPTModelData = new JSONModel({
          CTPT: [],
          SoForm: []
        });
        oController.getView().setModel(oCTPTModelData, "CTPTModel");
        //oController._initializeVariantManagement();

        //oController._registerForMDP13n();

      },
      handleStateChange: function (oEvent) {
        debugger;
        oController._meterTable = oController.getView().byId("meterDetailsTable");
        var oTableSettings = oController.getView().getModel("tableSettings").getData().tableMeterData;
        var oState = oEvent.getSource().getState();
        if (oState.sort) {
          oTableSettings.sort = {
            column: oState.sort.columnKey,
            order: oState.sort.sortOrder
          }
        }
        if (oState.filter) {
          oTableSettings.filter = oState.filter;
        }
        oTableSettings.columns = oState.columns.map(function (oColumn) {
          return {
            columnKey: oColumn.columnKey,
            visible: oColumn.visible,
            width: oColumn.width
          };
        });
        oController.getView().getModel("tableSettings").refresh();
      },
      _initializeVariantManagement: function () {
        debugger;
        var oView = this.getView();
        var oVariantManagement = oView.byId("idVMMeterDetails");
        sap.ushell.Container.getServiceAsync("Personalization").then(function (oPersonalizationService) {
          var oPersId = {
            container: "MeterDataVariant",
            item: "mdVariants"
          };
          oPersonalizationService.getContainer(oPersId.container).then(function (oContainer) {
            this._oContainer = oContainer;
            var oVariantSet = oContainer.getItemValue(oPersId.item) || { variants: [], defaultVariant: "" };
            this._loadVariants(oVariantSet);

            oVariantManagement.setModel(new JSONModel(oVariantSet.variants), "mdvariantItems");
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
        var oVM = oController.getView().byId("idVMMeterDetails");
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
        var oTable = oController.getView().byId("meterDetailsTable");
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
        var oTable = oController.getView().byId("meterDetailsTable");
        var sVariantKey = oEvent.getParameter("key");
        var objVariant = {}, objVariantItems = [], oName = '';
        objVariant = oEvent.getSource().oContext.getModel().getData();
        objVariantItems = objVariant["SOForm--idVMMeterDetails"].variants;

        for (var i = 0; i < objVariantItems.length; i++) {
          if (sVariantKey === objVariantItems[i].key) {
            oName = objVariantItems[i].title;
          }
        }
        if (sVariantKey === 'SOForm--idVMMeterDetails') {
          var aColumns = oTable.getColumns();
          aColumns.forEach(function (oColumn) {
            oColumn.setVisible(true);
          });
        }
        else {
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

        var oVariantData = oController._getTablePersonalizationData();
        var oVariantSet = this._oContainer.getItemValue("variantSet") || { "variants": [], defaultVariant: "" }
        var oVariantManagement = oController.getView().byId("idVMMeterDetails");
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
        objVariantItems = objVariant["SOForm--idVMMeterDetails"].variants;

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
          oController.getView().byId("idVMMeterDetails").setDefaultVariantKey(oParameters.def);
        }
        this._oContainer.setItemValue("variantSet", oVariantSet);
        this._oContainer.save().then(function () {
          MessageToast.show("Variants managed successfully!");
        }).catch(function (oError) {
          MessageToast.show("Error managing variants:" + oError.message);
        });

      },
      _getTablePersonalizationData: function () {
        var oTable = oController.getView().byId("meterDetailsTable");
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
      //****************************** start Settings Logic **********************************
      _registerForMDP13n: function () {
        debugger;
        oController._oTableMeterData = oController.getView().byId("meterDetailsTable");
        oController._oP13nEngine1 = Engine.getInstance();
        const oTable = this.getView().byId("meterDetailsTable");
        var oMetadataHelper = new MetadataHelper([
          {
            key: "idOrderID",
            label: "Order Number",
            path: "OrderID"
          },
          {
            key: "idOperation",
            label: "Operation",
            path: "Operation"
          },
          {
            key: "idCounter",
            label: "Counter",
            path: "Counter"
          },
          {
            key: "idAdditionalNotes",
            label: "Additional Notes",
            path: "additional_notes"
          },
          {
            key: "idAdditionalInfo",
            label: "Additional Info",
            path: "additional_info"
          },
          {
            key: "idMeterNo",
            label: "Meter Number",
            path: "UtilitiesDevice"
          },
          {
            key: "idNewMeterNo",
            label: "New Meter Number",
            path: "new_meter_num"
          },
          {
            key: "idOldMeterreadKWH",
            label: "Old Meter read KWH",
            path: "old_meter_read_kwh"
          },
          {
            key: "idNewMeterreadKWH",
            label: "New Meter read KWH",
            path: "new_meter_read_kwh"
          },
          {
            key: "idSecuritySealNo",
            label: "Security Seal Number",
            path: "new_security_seal"
          },
          {
            key: "idCorrectedTx",
            label: "Corrected Tx",
            path: "corrected_tx"
          },
          {
            key: "idNewTxNum",
            label: "New Tx Num",
            path: "new_tx_num"
          },
          {
            key: "idOldMeterreadW",
            label: "Old Meter read W",
            path: "old_meter_read_w"
          },
          {
            key: "idOldMeterreadVA",
            label: "Old Meter read VA",
            path: "old_meter_read_va"
          },
          {
            key: "idNewMeterreadW",
            label: "New Meter read W",
            path: "new_meter_read_w"
          },
          {
            key: "idNewMeterreadVA",
            label: "New Meter read VA",
            path: "new_meter_read_va"
          },
          {
            key: "idNewManufSerNo",
            label: "New Manufacturing Serial No",
            path: "Manufserialnumber"
          },
          {
            key: "idOlddeliveredreadKWH",
            label: "Old delivered read KWH",
            path: "old_delivered_reading_kwh"
          },
          {
            key: "idOlddeliveredreadW",
            label: "Old delivered read W",
            path: "old_delivered_reading_w"
          },
          {
            key: "idOlddeliveredreadVA",
            label: "Old delivered read VA",
            path: "old_delivered_reading_va"
          },
          {
            key: "idOldreceivedreadKWH",
            label: "Old received read KWH",
            path: "old_recieved_reading_kwh"
          },
          {
            key: "idOldreceivedreadW",
            label: "Old received read W",
            path: "old_recieved_reading_w"
          },
          {
            key: "idNewdeliveredreadKWH",
            label: "New delivered read KWH",
            path: "new_delivered_reading_kwh"
          },
          {
            key: "idNewdeliveredreadW",
            label: "New delivered read W",
            path: "new_delivered_reading_w"
          },
          {
            key: "idNewdeliveredreadVA",
            label: "New delivered read VA",
            path: "new_delivered_reading_va"
          },
          {
            key: "idNewreceivedreadKWH",
            label: "New received read KWH",
            path: "new_recieved_reading_kwh"
          },
          {
            key: "idNewrecievedreadW",
            label: "New recieved read W",
            path: "new_recieved_reading_w"
          },
          {
            key: "idNewrecievedreadVA",
            label: "New recieved read VA",
            path: "new_recieved_reading_va"
          },
          {
            key: "idOldCommEquipmentNo",
            label: "Old communication equipment number",
            path: "ex_comm_equip"
          },
          {
            key: "idOldCommAddress",
            label: "Old Communication address",
            path: "ex_comm_addr"
          },
          {
            key: "idReadOnlyPwd",
            label: "Read only password",
            path: "ex_readonly_pwd"
          },
          {
            key: "idNewReadOnlyPwd",
            label: "New read only password",
            path: "new_readonly_pwd"
          },
          {
            key: "idNewCommEquipmentNo",
            label: "New communication equipment number",
            path: "new_comm_equip"
          },
          {
            key: "idNewCommAddress",
            label: "New Communication address",
            path: "new_comm_addr"
          },
          {
            key: "idNewBillingPwd",
            label: "New billing password",
            path: "new_billing_pwd"
          },
          {
            key: "idBillableFlagIndicator",
            label: "Billable Flag Indicator",
            path: "Billable"
          },
          {
            key: "idOrderCompleteDate",
            label: "Order Complete Date",
            path: "Complete_date"
          },
          {
            key: "idMainActivity",
            label: "Main Activity",
            path: "Main_Activity"
          },
          {
            key: "idOrderCompleteTime",
            label: "Order Complete Time",
            path: "Completed_Time"
          },
          {
            key: "idNewMeterLoc",
            label: "NEW_METER_LOC",
            path: "UtilsDeviceLocationLocation"
          },
          {
            key: "idCompleteBy",
            label: "COMPLETE_BY",
            path: "COMPLETE_BY"
          },
          {
            key: "idVerbal",
            label: "VERBAL",
            path: "VERBAL"
          },
          {
            key: "idUnitId",
            label: "UNIT_ID",
            path: "UNIT_ID"
          },
          {
            key: "idTimeSyncReq",
            label: "TIME_SYNC_REQ",
            path: "TIME_SYNC_REQ"
          },
          {
            key: "idSetMPass",
            label: "SET_MPASS",
            path: "SET_MPASS"
          },
          {
            key: "idInstallRF",
            label: "INSTALL_RF",
            path: "INSTALL_RF"
          },
          {
            key: "idInvestigationReq",
            label: "INVESTIGATION_REQ",
            path: "INVESTIGATION_REQ"
          },
          {
            key: "idConvertEL",
            label: "CONVERT_EL",
            path: "CONVERT_EL"
          },
          {
            key: "idInvertalReady",
            label: "INTERVAL_READY",
            path: "INTERVAL_READY"
          },
          {
            key: "idIVP",
            label: "IVP",
            path: "IVP"
          },
          {
            key: "idOldMeterAction",
            label: "OLD_METER_ACTION",
            path: "OLD_METER_ACTION"
          },
          {
            key: "idManHRS",
            label: "MAN_HRS",
            path: "MAN_HRS"
          },
          {
            key: "idTruckHRS",
            label: "TRUCK_HRS",
            path: "TRUCK_HRS"
          },
          {
            key: "idOtherHRS",
            label: "OTHER_HRS",
            path: "OTHER_HRS"
          },
          {
            key: "idRemoved",
            label: "REMOVED",
            path: "REMOVED"
          },
          {
            key: "idChargeAcct",
            label: "CHARGE_ACCT",
            path: "CHARGE_ACCT"
          },
          {
            key: "idFieldReturnReason",
            label: "FIELD_RETURN_REASON",
            path: "FIELD_RETURN_REASON"
          },
          {
            key: "idRevNum",
            label: "Rev_Num",
            path: "Rev_Num"
          },
          {
            key: "idRowNum",
            label: "Row_Num",
            path: "Row_Num"
          },
          {
            key: "idEid",
            label: "Eid",
            path: "Eid"
          },
          {
            key: "idOLDMETERNUMCORECTD",
            label: "OLD_METERNUM_CORECTD",
            path: "Old_Meternum_Corectd"
          },
          {
            key: "idNEWMETERNUMCORECTD",
            label: "NEW_METERNUM_CORECTD",
            path: "New_Meternum_Corectd"
          },
          {
            key: "idNEWDELIVEREDREADKWHCORECTD",
            label: "NEW_DELIVERED_READ_KWH_CORECTD",
            path: "New_Delivered_Read_KWH_Corectd"
          },
          {
            key: "idNEWDELIVEREDREADKWCORECTD",
            label: "NEW_DELIVERED_READ_KW_CORECTD",
            path: "New_Delivered_Read_KW_Corectd"
          },
          {
            key: "idNEWDELIVEREDREADKVACORECTD",
            label: "NEW_DELIVERED_READ_KVA_CORECTD",
            path: "New_Delivered_Read_KVA_Corectd"
          },
          {
            key: "idNEWRECEIVEDREADKWHCORECTD",
            label: "NEW_RECEIVED_READ_KWH_CORECTD",
            path: "New_Received_Read_KWH_Corectd"
          },
          {
            key: "idNEWRECEIVEDREADKWCORECTD",
            label: "NEW_RECEIVED_READ_KW_CORECTD",
            path: "New_Received_Read_KW_Corectd"
          },
          {
            key: "idNEWRECEIVEDREADKVACORECTD",
            label: "NEW_RECEIVED_READ_KVA_CORECTD",
            path: "New_Received_Read_KVA_Corectd"
          },
          {
            key: "idNEWCOMMEQUIPCORECTD",
            label: "NEW_COMM_EQUIP_CORECTD",
            path: "New_Comm_Equip_Corectd"
          },
          {
            key: "idNEWCOMMADDRCORECTD",
            label: "NEW_COMM_ADDR_CORECTD",
            path: "New_Comm_Addr_Corectd"
          },
          {
            key: "idOLDDELIVEREDREADKWHCORECTD",
            label: "OLD_DELIVERED_READ_KWH_CORECTD",
            path: "Old_Delivered_Read_KWH_Corectd"
          },
          {
            key: "idOLDDELIVEREDREADKWCORECTD",
            label: "OLD_DELIVERED_READ_KW_CORECTD",
            path: "Old_Delivered_Read_KW_Corectd"
          },
          {
            key: "idOLDDELIVEREDREADKVACORECTD",
            label: "OLD_DELIVERED_READ_KVA_CORECTD",
            path: "Old_Delivered_Read_KVA_Corectd"
          },
          {
            key: "idOLDRECEIVEDREADKWHCORECTD",
            label: "OLD_RECEIVED_READ_KWH_CORECTD",
            path: "Old_Received_Read_KWH_Corectd"
          },
          {
            key: "idOLDRECEIVEDREADKWCORECTD",
            label: "OLD_RECEIVED_READ_KW_CORECTD",
            path: "Old_Received_Read_KW_Corectd"
          },
          {
            key: "idOLDRECEIVEDREADKVACORECTD",
            label: "OLD_RECEIVED_READ_KVA_CORECTD",
            path: "Old_Received_Read_KVA_Corectd"
          },
          {
            key: "idOLDCOMMEQUIPCORECTD",
            label: "OLD_COMM_EQUIP_CORECTD",
            path: "Old_Comm_Equip_Corectd"
          },
          {
            key: "idOLDCOMMADDRCORECTD",
            label: "OLD_COMM_ADDR_CORECTD",
            path: "Old_Comm_Addr_Corectd"
          }
        ]);

        this._mIntialWidth = {
          "idOrderID": "11rem",
          "idOperation": "11rem",
          "idCounter": "11rem",
          "idAdditionalNotes": "11rem",
          "idAdditionalInfo": "11rem",
          "idMeterNo": "11rem",
          "idNewMeterNo": "11rem",
          "idOldMeterreadKWH": "11rem",
          "idNewMeterreadKWH": "11rem",
          "idSecuritySealNo": "11rem",
          "idCorrectedTx": "11rem",
          "idNewTxNum": "11rem",
          "idOldMeterreadW": "11rem",
          "idOldMeterreadVA": "11rem",
          "idNewMeterreadW": "11rem",
          "idNewMeterreadVA": "11rem",
          "idNewManufSerNo": "11rem",
          "idOlddeliveredreadKWH": "11rem",
          "idOlddeliveredreadW": "11rem",
          "idOlddeliveredreadVA": "11rem",
          "idOldreceivedreadKWH": "11rem",
          "idOldreceivedreadW": "11rem",
          "idNewdeliveredreadKWH": "11rem",
          "idNewdeliveredreadW": "11rem",
          "idNewdeliveredreadVA": "11rem",
          "idNewreceivedreadKWH": "11rem",
          "idNewrecievedreadW": "11rem",
          "idNewrecievedreadVA": "11rem",
          "idOldCommEquipmentNo": "11rem",
          "idOldCommAddress": "11rem",
          "idReadOnlyPwd": "11rem",
          "idNewReadOnlyPwd": "11rem",
          "idNewCommEquipmentNo": "11rem",
          "idNewCommAddress": "11rem",
          "idNewBillingPwd": "11rem",
          "idBillableFlagIndicator": "11rem",
          "idOrderCompleteDate": "11rem",
          "idMainActivity": "11rem",
          "idOrderCompleteTime": "11rem",
          "idNewMeterLoc": "11rem",
          "idCompleteBy": "11rem",
          "idVerbal": "11rem",
          "idUnitId": "11rem",
          "idTimeSyncReq": "11rem",
          "idSetMPass": "11rem",
          "idInstallRF": "11rem",
          "idInvestigationReq": "11rem",
          "idConvertEL": "11rem",
          "idInvertalReady": "11rem",
          "idIVP": "11rem",
          "idOldMeterAction": "11rem",
          "idManHRS": "11rem",
          "idTruckHRS": "11rem",
          "idOtherHRS": "11rem",
          "idRemoved": "11rem",
          "idChargeAcct": "11rem",
          "idFieldReturnReason": "11rem",
          "idRevNum": "11rem",
          "idRowNum": "11rem",
          "idEid": "11rem",
          "idOLDMETERNUMCORECTD": "11rem",
          "idNEWMETERNUMCORECTD": "11rem",
          "idNEWDELIVEREDREADKWHCORECTD": "11rem",
          "idNEWDELIVEREDREADKWCORECTD": "11rem",
          "idNEWDELIVEREDREADKVACORECTD": "11rem",
          "idNEWRECEIVEDREADKWHCORECTD": "11rem",
          "idNEWRECEIVEDREADKWCORECTD": "11rem",
          "idNEWRECEIVEDREADKVACORECTD": "11rem",
          "idNEWCOMMEQUIPCORECTD": "11rem",
          "idNEWCOMMADDRCORECTD": "11rem",
          "idOLDDELIVEREDREADKWHCORECTD": "11rem",
          "idOLDDELIVEREDREADKWCORECTD": "11rem",
          "idOLDDELIVEREDREADKVACORECTD": "11rem",
          "idOLDRECEIVEDREADKWHCORECTD": "11rem",
          "idOLDRECEIVEDREADKWCORECTD": "11rem",
          "idOLDRECEIVEDREADKVACORECTD": "11rem",
          "idOLDCOMMEQUIPCORECTD": "11rem",
          "idOLDCOMMADDRCORECTD": "11rem",
        };

        // oController._oP13nEngine1.register(oController._oTableMeterData, {
        //   helper: oMetadataHelper,
        //   controller: {
        //     Columns: new SelectionController({
        //       targetAggregation: "columns",
        //       control: oController._oTableMeterData
        //     }),
        //     Sorter: new SortController({
        //       control: oController._oTableMeterData
        //     }),
        //     Groups: new GroupController({
        //       control: oController._oTableMeterData
        //     }),
        //     ColumnWidth: new ColumnWidthController({
        //       control: oController._oTableMeterData
        //     })
        //   }
        // });

        //oController._oP13nEngine1.attachStateChange(oController.handleMDStateChange.bind(this));
      },

      onSettingsPressed: function (oEvent) {
        var oTable = oController.getView().byId("meterDetailsTable");
        var oP13nDialog = new P13nDialog({
          panels: [
            new P13nColumnsPanel({
              items: oController._getColumnItems(oTable)
            })
          ],
          ok: function (oEvent) {
            oController._applyP13nSettings(oEvent, oTable);
            oP13nDialog.close();
          }.bind(oController),
          cancel: function () {
            oP13nDialog.close();
          }
        })
        oP13nDialog.open();
      },
      _getColumnItems: function (oTable) {
        var aItems = [];
        oTable.getColumns().forEach(function (oColumn) {
          aItems.push({
            columnKey: oColumn.getId(),
            text: oColumn.getLabel().getText(),
            visible: oColumn.getVisible(),
            sortProperty: oColumn.getSortProperty(),
            filterProperty: oColumn.getFilterProperty()
          });
        });
        return aItems;
      },
      _applyP13nSettings: function (oEvent, oTable) {
        var oParams = oEvent.getParameters();
        oParams.payload.columns?.tableItems.forEach(function (oItem) {
          var oColumn = oTable.getColumns().find(function (oCol) {
            return oCol.getId() === oItem.columnKey;
          });
          if (oColumn) {
            oColumn.setVisible(oItem.visible);
          }
        });
      },

      //****************************** End Settings Logic *******************************

      // _initialData: {
      //   columns: [
      //     {
      //       visible: true, id: "idOrderID",
      //       label: "Order Number",
      //       path: "OrderID"
      //     },
      //     {
      //       visible: true, id: "idOperation",
      //       label: "Operation",
      //       path: "Operation"
      //     },
      //     {
      //       visible: true, id: "idCounter",
      //       label: "Counter",
      //       path: "Counter"
      //     },
      //     {
      //       visible: true, id: "idAdditionalNotes",
      //       label: "Additional Notes",
      //       path: "additional_notes"
      //     },
      //     {
      //       visible: true, id: "idAdditionalInfo",
      //       label: "Additional Info",
      //       path: "additional_info"
      //     },
      //     {
      //       visible: true, id: "idMeterNo",
      //       label: "Meter Number",
      //       path: "UtilitiesDevice"
      //     },
      //     {
      //       visible: true, id: "idNewMeterNo",
      //       label: "New Meter Number",
      //       path: "new_meter_num"
      //     },
      //     {
      //       visible: true, id: "idOldMeterreadKWH",
      //       label: "Old Meter read KWH",
      //       path: "old_meter_read_kwh"
      //     },
      //     {
      //       visible: true, id: "idNewMeterreadKWH",
      //       label: "New Meter read KWH",
      //       path: "new_meter_read_kwh"
      //     },
      //     {
      //       visible: true, id: "idSecuritySealNo",
      //       label: "Security Seal Number",
      //       path: "new_security_seal"
      //     },
      //     {
      //       visible: true, id: "idCorrectedTx",
      //       label: "Corrected Tx",
      //       path: "corrected_tx"
      //     },
      //     {
      //       visible: true, id: "idNewTxNum",
      //       label: "New Tx Num",
      //       path: "new_tx_num"
      //     },
      //     {
      //       visible: true, id: "idOldMeterreadW",
      //       label: "Old Meter read W",
      //       path: "old_meter_read_w"
      //     },
      //     {
      //       visible: true, id: "idOldMeterreadVA",
      //       label: "Old Meter read VA",
      //       path: "old_meter_read_va"
      //     },
      //     {
      //       visible: true, id: "idNewMeterreadW",
      //       label: "New Meter read W",
      //       path: "new_meter_read_w"
      //     },
      //     {
      //       visible: true, id: "idNewMeterreadVA",
      //       label: "New Meter read VA",
      //       path: "new_meter_read_va"
      //     },
      //     {
      //       visible: true, id: "idNewManufSerNo",
      //       label: "New Manufacturing Serial No",
      //       path: "Manufserialnumber"
      //     },
      //     {
      //       visible: true, id: "idOlddeliveredreadKWH",
      //       label: "Old delivered read KWH",
      //       path: "old_delivered_reading_kwh"
      //     },
      //     {
      //       visible: true, id: "idOlddeliveredreadW",
      //       label: "Old delivered read W",
      //       path: "old_delivered_reading_w"
      //     },
      //     {
      //       visible: true, id: "idOlddeliveredreadVA",
      //       label: "Old delivered read VA",
      //       path: "old_delivered_reading_va"
      //     },
      //     {
      //       visible: true, id: "idOldreceivedreadKWH",
      //       label: "Old received read KWH",
      //       path: "old_recieved_reading_kwh"
      //     },
      //     {
      //       visible: true, id: "idOldreceivedreadW",
      //       label: "Old received read W",
      //       path: "old_recieved_reading_w"
      //     },
      //     {
      //       visible: true, id: "idNewdeliveredreadKWH",
      //       label: "New delivered read KWH",
      //       path: "new_delivered_reading_kwh"
      //     },
      //     {
      //       visible: true, id: "idNewdeliveredreadW",
      //       label: "New delivered read W",
      //       path: "new_delivered_reading_w"
      //     },
      //     {
      //       visible: true, id: "idNewdeliveredreadVA",
      //       label: "New delivered read VA",
      //       path: "new_delivered_reading_va"
      //     },
      //     {
      //       visible: true, id: "idNewreceivedreadKWH",
      //       label: "New received read KWH",
      //       path: "new_recieved_reading_kwh"
      //     },
      //     {
      //       visible: true, id: "idNewrecievedreadW",
      //       label: "New recieved read W",
      //       path: "new_recieved_reading_w"
      //     },
      //     {
      //       visible: true, id: "idNewrecievedreadVA",
      //       label: "New recieved read VA",
      //       path: "new_recieved_reading_va"
      //     },
      //     {
      //       visible: true, id: "idOldCommEquipmentNo",
      //       label: "Old communication equipment number",
      //       path: "ex_comm_equip"
      //     },
      //     {
      //       visible: true, id: "idOldCommAddress",
      //       label: "Old Communication address",
      //       path: "ex_comm_addr"
      //     },
      //     {
      //       visible: true, id: "idReadOnlyPwd",
      //       label: "Read only password",
      //       path: "ex_readonly_pwd"
      //     },
      //     {
      //       visible: true, id: "idNewReadOnlyPwd",
      //       label: "New read only password",
      //       path: "new_readonly_pwd"
      //     },
      //     {
      //       visible: true, id: "idNewCommEquipmentNo",
      //       label: "New communication equipment number",
      //       path: "new_comm_equip"
      //     },
      //     {
      //       visible: true, id: "idNewCommAddress",
      //       label: "New Communication address",
      //       path: "new_comm_addr"
      //     },
      //     {
      //       visible: true, id: "idNewBillingPwd",
      //       label: "New billing password",
      //       path: "new_billing_pwd"
      //     },
      //     {
      //       visible: true, id: "idBillableFlagIndicator",
      //       label: "Billable Flag Indicator",
      //       path: "Billable"
      //     },
      //     {
      //       visible: true, id: "idOrderCompleteDate",
      //       label: "Order Complete Date",
      //       path: "Complete_date"
      //     },
      //     {
      //       visible: true, id: "idMainActivity",
      //       label: "Main Activity",
      //       path: "Main_Activity"
      //     },
      //     {
      //       visible: true, id: "idOrderCompleteTime",
      //       label: "Order Complete Time",
      //       path: "Completed_Time"
      //     },
      //     {
      //       visible: true, id: "idNewMeterLoc",
      //       label: "NEW_METER_LOC",
      //       path: "UtilsDeviceLocationLocation"
      //     },
      //     {
      //       visible: true, id: "idCompleteBy",
      //       label: "COMPLETE_BY",
      //       path: "COMPLETE_BY"
      //     },
      //     {
      //       visible: true, id: "idVerbal",
      //       label: "VERBAL",
      //       path: "VERBAL"
      //     },
      //     {
      //       visible: true, id: "idUnitId",
      //       label: "UNIT_ID",
      //       path: "UNIT_ID"
      //     },
      //     {
      //       visible: true, id: "idTimeSyncReq",
      //       label: "TIME_SYNC_REQ",
      //       path: "TIME_SYNC_REQ"
      //     },
      //     {
      //       visible: true, id: "idSetMPass",
      //       label: "SET_MPASS",
      //       path: "SET_MPASS"
      //     },
      //     {
      //       visible: true, id: "idInstallRF",
      //       label: "INSTALL_RF",
      //       path: "INSTALL_RF"
      //     },
      //     {
      //       visible: true, id: "idInvestigationReq",
      //       label: "INVESTIGATION_REQ",
      //       path: "INVESTIGATION_REQ"
      //     },
      //     {
      //       visible: true, id: "idConvertEL",
      //       label: "CONVERT_EL",
      //       path: "CONVERT_EL"
      //     },
      //     {
      //       visible: true, id: "idInvertalReady",
      //       label: "INTERVAL_READY",
      //       path: "INTERVAL_READY"
      //     },
      //     {
      //       visible: true, id: "idIVP",
      //       label: "IVP",
      //       path: "IVP"
      //     },
      //     {
      //       visible: true, id: "idOldMeterAction",
      //       label: "OLD_METER_ACTION",
      //       path: "OLD_METER_ACTION"
      //     },
      //     {
      //       visible: true, id: "idManHRS",
      //       label: "MAN_HRS",
      //       path: "MAN_HRS"
      //     },
      //     {
      //       visible: true, id: "idTruckHRS",
      //       label: "TRUCK_HRS",
      //       path: "TRUCK_HRS"
      //     },
      //     {
      //       visible: true, id: "idOtherHRS",
      //       label: "OTHER_HRS",
      //       path: "OTHER_HRS"
      //     },
      //     {
      //       visible: true, id: "idRemoved",
      //       label: "REMOVED",
      //       path: "REMOVED"
      //     },
      //     {
      //       visible: true, id: "idChargeAcct",
      //       label: "CHARGE_ACCT",
      //       path: "CHARGE_ACCT"
      //     },
      //     {
      //       visible: true, id: "idFieldReturnReason",
      //       label: "FIELD_RETURN_REASON",
      //       path: "FIELD_RETURN_REASON"
      //     },
      //     {
      //       visible: true, id: "idRevNum",
      //       label: "Rev_Num",
      //       path: "Rev_Num"
      //     },
      //     {
      //       visible: true, id: "idRowNum",
      //       label: "Row_Num",
      //       path: "Row_Num"
      //     },
      //     {
      //       visible: true, id: "idEid",
      //       label: "Eid",
      //       path: "Eid"
      //     },
      //     {
      //       visible: true, id: "idOLDMETERNUMCORECTD",
      //       label: "OLD_METERNUM_CORECTD",
      //       path: "Old_Meternum_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWMETERNUMCORECTD",
      //       label: "NEW_METERNUM_CORECTD",
      //       path: "New_Meternum_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWDELIVEREDREADKWHCORECTD",
      //       label: "NEW_DELIVERED_READ_KWH_CORECTD",
      //       path: "New_Delivered_Read_KWH_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWDELIVEREDREADKWCORECTD",
      //       label: "NEW_DELIVERED_READ_KW_CORECTD",
      //       path: "New_Delivered_Read_KW_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWDELIVEREDREADKVACORECTD",
      //       label: "NEW_DELIVERED_READ_KVA_CORECTD",
      //       path: "New_Delivered_Read_KVA_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWRECEIVEDREADKWHCORECTD",
      //       label: "NEW_RECEIVED_READ_KWH_CORECTD",
      //       path: "New_Received_Read_KWH_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWRECEIVEDREADKWCORECTD",
      //       label: "NEW_RECEIVED_READ_KW_CORECTD",
      //       path: "New_Received_Read_KW_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWRECEIVEDREADKVACORECTD",
      //       label: "NEW_RECEIVED_READ_KVA_CORECTD",
      //       path: "New_Received_Read_KVA_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWCOMMEQUIPCORECTD",
      //       label: "NEW_COMM_EQUIP_CORECTD",
      //       path: "New_Comm_Equip_Corectd"
      //     },
      //     {
      //       visible: true, id: "idNEWCOMMADDRCORECTD",
      //       label: "NEW_COMM_ADDR_CORECTD",
      //       path: "New_Comm_Addr_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDDELIVEREDREADKWHCORECTD",
      //       label: "OLD_DELIVERED_READ_KWH_CORECTD",
      //       path: "Old_Delivered_Read_KWH_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDDELIVEREDREADKWCORECTD",
      //       label: "OLD_DELIVERED_READ_KW_CORECTD",
      //       path: "Old_Delivered_Read_KW_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDDELIVEREDREADKVACORECTD",
      //       label: "OLD_DELIVERED_READ_KVA_CORECTD",
      //       path: "Old_Delivered_Read_KVA_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDRECEIVEDREADKWHCORECTD",
      //       label: "OLD_RECEIVED_READ_KWH_CORECTD",
      //       path: "Old_Received_Read_KWH_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDRECEIVEDREADKWCORECTD",
      //       label: "OLD_RECEIVED_READ_KW_CORECTD",
      //       path: "Old_Received_Read_KW_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDRECEIVEDREADKVACORECTD",
      //       label: "OLD_RECEIVED_READ_KVA_CORECTD",
      //       path: "Old_Received_Read_KVA_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDCOMMEQUIPCORECTD",
      //       label: "OLD_COMM_EQUIP_CORECTD",
      //       path: "Old_Comm_Equip_Corectd"
      //     },
      //     {
      //       visible: true, id: "idOLDCOMMADDRCORECTD",
      //       label: "OLD_COMM_ADDR_CORECTD",
      //       path: "Old_Comm_Addr_Corectd"
      //     }
      //   ]
      // },
      // _setInitialData: function () {
      //   var oView = this.getView();

      //   var oSelectionPanel = oView.byId("columnsPanel");
      //   // var oSortPanel = oView.byId("sortPanel");
      //   // var oGroupPanel = oView.byId("groupPanel");

      //   oSelectionPanel.setP13nData(this._initialData.columns);
      //   // oSortPanel.setP13nData(this._initialData.sort);
      //   // oGroupPanel.setP13nData(this._initialData.group);
      // },
      // onSettingsPressed: function (oEvt) {
      //   var oView = this.getView();
      //   var oPopup = oView.byId("p13nPopup");
      //   if (!this._bIsOpen) {
      //     this._setInitialData();
      //     this._bIsOpen = true;
      //   }

      //   oPopup.open(oEvt.getSource());
      // },
      // onClose: function (oEvent) {
      //   var sReason = oEvent.getParameter("reason");
      //   MessageToast.show("Dialog close reason: " + sReason);
      //   var oPopup = oEvent.getSource();
      //   var oSelectionPanel = oPopup.getPanels().find(function (oPanel) {
      //     return oPanel instanceof sap.m.p13n.SelectionPanel;
      //   });
      //   if (oSelectionPanel) {
      //     var aSelectedItems = oSelectionPanel.getP13nData();
      //     var aColumnData = aSelectedItems.map(function (oItem, i) {
      //       return {
      //         columnKey: oItem.id,
      //         text: oItem.label,
      //         visible: oItem.visible,
      //         index: i
      //       };
      //     });
      //     oController._applyColumnChanges(aColumnData);
      //   }
      // },
      // _applyColumnChanges: function (aColumnData) {
      //   var oTable = oController.getView().byId("meterDetailsTable");
      //   var aColumns = oTable.getColumns();
      //   aColumnData.forEach(function (oColumnData, i) {
      //     var oColumn = aColumns.find(function (oCol) {
      //       return oCol.getName() === oColumnData.columnKey;
      //     });
      //     if (oColumn) {
      //       oColumn.setVisible(oColumnData.visible);
      //       oTable.removeColumn(oColumn);
      //       oTable.insertColumn(oColumn, oColumnData.index);
      //     }
      //   });
      // },
      // reset: function (oEvt) {
      //   this._setInitialData();
      //   this.parseP13nState();
      // },
      // parseP13nState: function (oEvt) {
      //   var oTable = oController.getView().byId("meterDetailsTable");
      //   if (oEvt) {
      //     MessageToast.show("P13n panel change reason:" + oEvt.getParameter("reason"));
      //   }
      //   var oView = this.getView();

      //   var oP13nState = {
      //     columns: oView.byId("columnsPanel").getP13nData()
      //     // sort: oView.byId("sortPanel").getP13nData(),
      //     // group: oView.byId("groupPanel").getP13nData()
      //   };
      //   var intIndex = 0;

      //   oP13nState?.columns.forEach(function (oItem, intIndex) {
      //     var oColumn = oTable.getColumns().find(function (oCol) {
      //       return oCol.getName() === oItem.id;
      //     });
      //     if (oColumn) {
      //       oColumn.setVisible(oItem.visible);
      //       intIndex++;
      //     }
      //   });

      // },


      _onRouteMatch: function (oEvent) {
        debugger;
        var sOrderNum = oEvent.getParameter("arguments").OrderID;
        //var OPS_NO = oEvent.getParameter("arguments").OPSNo;
        oController._orderNumber = sOrderNum;
        var oModel = oController.getView().getModel("CTPTModel");
        if (sOrderNum) {
          // oController.getView().byId("idTableCTPT").bindRows({
          //   path: "/Ctpt_Dataset",
          //   filters: new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum) //"6051817"
          // });
          debugger;
          var aFilter = [];
          aFilter.push(new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum));
          oOEBoDataModel.read("/Ctpt_Dataset", {
            filters: aFilter,
            success: function (oData) {
              debugger;
              oModel.setProperty("/CTPT", oData.results);
            }, error: function (oError) {
              var oMessage;
              debugger;
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
          })

          // oController.getView().byId("meterDetailsTable").bindRows({
          //   path: "/Meter_DataSet",
          //   filters: new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum)
          // });
          // var aFilter = [];
          // aFilter.push(new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum));
          oOEBoDataModel.read("/Meter_DataSet", {
            filters: aFilter,
            success: function (oData) {
              oModel.setProperty("/SoForm", oData.results);
              debugger;
            }, error: function (oError) {
              var oMessage;
              debugger;
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
          })
        }
      },
      onSubmitFieldMonList: function (oEvent) {
        debugger;
      },
      onSave: function (oEvent) {
        debugger;
        var oMeterset = [], oCTPT = [], oMeterDetails = [], oCTPTDetails = [];
        var oModel = oController.getView().getModel("CTPTModel");
        oMeterset = oModel.getProperty("/SoForm");
        oCTPT = oModel.getProperty("/CTPT");
        for (var i = 0; i < oMeterset.length; i++) {
          oMeterDetails.push({
            "Rev_Num": oMeterset[i].Rev_Num,
            "Row_Num": oMeterset[i].Row_Num,
            "Eid": oMeterset[i].Eid,
            "Old_Meternum_Corectd": oMeterset[i].Old_Meternum_Corectd,
            "New_Meternum_Corectd": oMeterset[i].New_Meternum_Corectd,
            "New_Delivered_Read_KWH_Corectd": oMeterset[i].New_Delivered_Read_KWH_Corectd,
            "New_Delivered_Read_KW_Corectd": oMeterset[i].New_Delivered_Read_KW_Corectd,
            "New_Delivered_Read_KVA_Corectd": oMeterset[i].New_Delivered_Read_KVA_Corectd,
            "New_Received_Read_KWH_Corectd": oMeterset[i].New_Received_Read_KWH_Corectd,
            "New_Received_Read_KW_Corectd": oMeterset[i].New_Received_Read_KW_Corectd,
            "New_Received_Read_KVA_Corectd": oMeterset[i].New_Received_Read_KVA_Corectd,
            "New_Comm_Equip_Corectd": oMeterset[i].New_Comm_Equip_Corectd,
            "New_Comm_Addr_Corectd": oMeterset[i].New_Comm_Addr_Corectd,
            "Old_Delivered_Read_KWH_Corectd": oMeterset[i].Old_Delivered_Read_KWH_Corectd,
            "Old_Delivered_Read_KW_Corectd": oMeterset[i].Old_Delivered_Read_KW_Corectd,
            "Old_Delivered_Read_KVA_Corectd": oMeterset[i].Old_Delivered_Read_KVA_Corectd,
            "Old_Received_Read_KWH_Corectd": oMeterset[i].Old_Received_Read_KWH_Corectd,
            "Old_Received_Read_KW_Corectd": oMeterset[i].Old_Received_Read_KW_Corectd,
            "Old_Received_Read_KVA_Corectd": oMeterset[i].Old_Received_Read_KVA_Corectd,
            "Old_Comm_Equip_Corectd": oMeterset[i].Old_Comm_Equip_Corectd,
            "Old_Comm_Addr_Corectd": oMeterset[i].Old_Comm_Addr_Corectd
          });
        }

        for (var j = 0; j < oCTPT.length; j++) {
          oCTPTDetails.push({
            "Rev_Num": oCTPT[j].Rev_Num,
            "Row_Num": oCTPT[j].Row_Num,
            "Eid": oCTPT[j].Eid,
            "NewSerialnumber_Corectd": oCTPT[j].NewSerialnumber_Corectd,
            "OldSerialnumber_Corectd": oCTPT[j].OldSerialnumber_Corectd,
            "Denominator_Corectd": oCTPT[j].Denominator_Corectd,
            "Numerator_Corectd": oCTPT[j].Numerator_Corectd
          });
        }

        var oPayload = {
          "Order_No": oController._orderNumber,
          "NavOrderHeaderToMeterData": oMeterDetails,
          "NavOrderHeaderToCtptdata": oCTPTDetails
        };
        if (oMeterset.length > 0 || oCTPT.length > 0) {
          oOEBoDataModel.create("/OrderHeaderSet", oPayload, {
            success: function (data) {
              debugger;
              MessageBox.success("Data posted successfully...");
              oModel.refresh(true);
              //window.location.reload();
            },
            error: function (oError) {
              debugger;
              var oMessage;
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
        }
        else {
          return MessageBox.error("There are no records!");
        }

      }
    });
  }
);