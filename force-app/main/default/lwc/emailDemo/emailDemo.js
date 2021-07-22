import { LightningElement, track,wire } from 'lwc';
//import { getListInfoByName } from 'lightning/uiRecordApi';
import { getListUi } from 'lightning/uiListApi';
import { getListInfoByName } from 'lightning/uiListsApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account'; 

import { getObjectInfo, getObjectInfos } from 'lightning/uiObjectInfoApi';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import USER_OBJECT from '@salesforce/schema/User';
import LEAD_OBJECT from '@salesforce/schema/Lead';
import CASE_OBJECT from '@salesforce/schema/Case';




export default class EmailDemo extends LightningElement {
   
    @track whatId;
    @track whoId;

    @track whatItems = [];

    @track whoItems = [];

    @track accountList;

    objectInfos;
    recordListInfos;
    uilistInfo;
    recordInfos = {};

    objectApiNames = [ACCOUNT_OBJECT,USER_OBJECT, CASE_OBJECT];

    @wire(getListInfoByName, {
        objectApiName: ACCOUNT_OBJECT.objectApiName,
        listViewApiName: 'AllAccounts'
    })
    listInfo({ error, data }) {
        if (data) {
            this.recordListInfos = data;
            this.whoItems = data.records;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.recordListInfos = undefined;
        }
    }

    @wire(getListUi,{objectApiName:ACCOUNT_OBJECT,listViewApiName:'AllAccounts',pageSize:100})
      wiredAccountList({error,data}) {
          if(data) {
             this.accountList = data;
             this.error = null;
         } else if(error) {
            this.error = error;
             this.accountList = null;
         }
    }

    @track apiName;
    listViewApiName;
    @wire(getListUi,{objectApiName:'$apiName',listViewApiName:'$listViewApiName',pageSize:100})
      wiredGetListUi({error,data}) {
          if(data) {
             this.accountList = data;
             this.error = undefined;
             this.recordInfos[this.apiName] = data;
            if (this.accountList){
                this.whoItems = this.accountList.records.records.map(e=>{
                    return {label:e.fields.Name.value, value:e.fields.Id.value,data:e};
                });
            }
         } else if(error) {
            this.error = error;
             this.accountList = undefined;
         }
    }

    
    // @wire(getListInfoByName, {
    //     objectApiName: ACCOUNT_OBJECT.objectApiName,
    //     listViewApiName: 'AllAccounts'
    // })
    // recordListInfo({ error, data }) {
    //     if (data) {
    //         this.uilistInfo = data;
    //         this.error = undefined;
    //     } else if (error) {
    //         this.error = error;
    //         this.uilistInfo = undefined;
    //     }
    // }

    @wire(getObjectInfos, { objectApiNames: '$objectApiNames' })
    listobjectInfos({ error, data }){
        if (data) {
            this.objectInfos = data;
            this.error = undefined;
            this.updateWhatItems();
        } else if (error) {
            this.error = error;
            this.displayColumns = undefined;
        }
    }

    onWhatChange(event){
        this.apiName = event.detail.value;
        console.log(this.getRecordsByApi(this.apiName));
        if (this.accountList){
            this.whoItems = this.accountList.records.records.map(e=>{
                return {label:e.fields.Name.value, value:e.fields.Id.value,data:e};
            });
        }

        try{
            // objectApiName?: string | ObjectId, 
            // listViewApiName?: string | symbol, 
            // listViewId?: string, 
            // pageToken?: string, 
            // pageSize?: number, 
            // sortBy?: string | FieldId, 
            // fields?: (string | FieldId)[], 
            // optionalFields?: (string | FieldId)[]
            //this.apiName=this.whatId;
            this.listViewApiName='All'+this.apiName+'s';
            //var ret = getListUi({objectApiName:this.whatId,listViewApiName:'All'+this.whatId+'s',pageSize:100});
            //console.log(ret);
        }catch(e){
            console.log(e);
        }
    }

    onWhoChange(event){
        if (['Contact', 'Lead'].indexOf(this.apiName) == -1){
            this.whatId = event.detail.value;
            this.whoId= undefined;
        }else{
            this.whoId = event.detail.value;
            this.whatId= undefined;
        }
    }

    updateWhatItems(){
        if(!this.objectInfos){
            return;
        }
        if (Array.isArray(this.objectInfos.results)){
            this.whatItems = this.objectInfos.results.map(e=>{
                return {label:e.result.apiName, value:e.result.apiName};
            })
        }
    }

    getRecordsByApi(objApi){
        return this.objectInfos.results.find((e)=>{
            return e.result.apiName == objApi;
        });
    }


    handleUploadFile(event){
        if(event.detail.action=='add'){
            event.detail.files.forEach(element => {
                console.log('demo add attachment file:' +JSON.stringify(element));
            });
        }
        if(event.detail.action=='remove'){
            event.detail.files.forEach(element => {
                console.log('demo add attachment file:' +JSON.stringify(element));
            });
        }
    }
}