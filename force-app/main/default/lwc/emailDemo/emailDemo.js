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
import FIELD_NAME from '@salesforce/schema/Contact.Name';
import FIELD_ID from '@salesforce/schema/Contact.Id';
import FIELD_EMAIL from '@salesforce/schema/Contact.Email';


import getEmailTemplates from '@salesforce/apex/EmailCommunicationController.getEmailTemplates';
import searchRecordList from '@salesforce/apex/EmailCommunicationController.searchRecordList';
import FolderName from '@salesforce/schema/Report.FolderName';


const FIELDS = [FIELD_NAME, FIELD_ID, FIELD_EMAIL];

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

    
    accountrecordid;

    objectApiNames = [ACCOUNT_OBJECT,USER_OBJECT, CASE_OBJECT];

    options = {template:{
                            filters: [{
                                folderName:'CE Test Folder'
                            }]
                        }  
              };

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

        if (this.apiName == 'Account'){
            this.accountrecordid = event.detail.value;
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

    filterVars;

    //getRecordList(ObjectRecordApi objectApi, FieldRecordApi[] fields, FieldRecordApi[] filterVars, Integer offset, Integer limits)
    @wire(searchRecordList, {objectApi: CONTACT_OBJECT, fields:FIELDS, filterVars:'$filterVars', offset:0, limits:100})
    wire_getRecordList({error, data}){
        this.contactList = [];
        this.total = 0;
        if (data){
            console.log('query contacts:');
            
            (data.result || []).forEach(e=>{
                console.log(JSON.stringify(e));
                this.contactList.push(JSON.parse(JSON.stringify(e)));
            });
            this.total = data.count;
            this.renderDropItems();
            console.log(data.count);
        }else if (error){
            this.error = error;
        }
    }


    contactList = [];
    pageSize = 10;
    filterVar = '';
    total = 0;
    testItem = [];
    _testDefaultItem = [];

    @wire(getEmailTemplates, {offset: 0, limits:'$pageSize', filterVar:'$filterVar'})
    wire_allContacts({error, data}){
        this.contactList = [];
        if (data){
            data.result.forEach(e=>{
                this.contactList.push(JSON.parse(JSON.stringify(e)));
            });
            this.total = data.count;
            this.renderDropItems();
        }else if (error){
            this.error = error;
        }
    }
    handleShowMore(event){
        this.pageSize = this.pageSize + 10;
    }
    purposeContactChange(event){
        let filter = event.detail.value;
        if (!filter) {
            this.renderDropItems();
            return;
        }
        this.pageSize = 10;
        
        let emails = filter.split(';');
        if (emails.length > 0){
            let searchVar = emails[emails.length-1];
            this.filterVars = [{value:searchVar, fieldApiName:FIELD_EMAIL.fieldApiName}];
        }else{
            this.filterVars = [{value:'', fieldApiName:FIELD_EMAIL.fieldApiName}];
        }

    }

    renderDropItems(){
        if (!this.filterVar){
            //this.testItem = this._testDefaultItem;
        }else{
        }
        this.testItem = (this.contactList || []).map((e, index)=>{
            return {label:index + ' ' + e.Name, value:e.Name,icon:'standard:account',selectable:true, input:e.Email};
        })
        if (this.total>this.testItem.length){
            this.testItem.push({label:'Show More...', value:'ShowMore',icon:'',selectable:false, checkable: false})
        }
    }
}