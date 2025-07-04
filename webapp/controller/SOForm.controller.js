sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token"
  ],
  function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token) {
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
        // oOEBoDataModel.attachBatchRequestSent(function () {
        //   oController.getView().byId("idIconTabBarMeterDetails").setBusy(true);
        // });
        // oOEBoDataModel.attachBatchRequestCompleted(function () {
        //   oController.getView().byId("idIconTabBarMeterDetails").setBusy(false);
        // });
        // oOEBoDataModel.attachBatchRequestFailed(function (oError) {
        //   oController.getView().byId("idIconTabBarMeterDetails").setBusy(false);
        //   // MessageBox
        //   var oTableCTPT = oController.getView().byId("idTableCTPT");
        //   var oTableMeterDetails = oController.getView().byId("meterDetailsTable");
        //   oTableCTPT.setNoDataText("No CT/PT data found");
        //   oTableMeterDetails.setNoDataText("No Meter Details data found");
        // });
      },
      _onRouteMatch: function (oEvent) {
        debugger;
        var sOrderNum = oEvent.getParameter("arguments").OrderID;
        var OPS_NO = oEvent.getParameter("arguments").OPSNo;
        oController._orderNumber = sOrderNum;
        oController._OPS_NO = OPS_NO;
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
            "NewSerialnumber_Corectd": oCTPT[j].NewSerialnumber_Corectd,
            "OldSerialnumber_Corectd": oCTPT[j].OldSerialnumber_Corectd,
            "Denominator_Corectd": oCTPT[j].Denominator_Corectd,
            "Numerator_Corectd": oCTPT[j].Numerator_Corectd
          });
        }

        var oPayload = {
          "Order_No": oController._orderNumber,
          "Ops_No": oController._OPS_NO,
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