import { LightningElement, api, wire, track} from 'lwc';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import { getListUi } from 'lightning/uiListApi';

import CONTACT_OBJECT from '@salesforce/schema/Contact';
import FIELD_ID from '@salesforce/schema/Contact.Id';
import FIELD_Name from '@salesforce/schema/Contact.Name';
import FIELD_Email from '@salesforce/schema/Contact.Email';
import FIELD_Salutation from '@salesforce/schema/Contact.Salutation';

const fields = [FIELD_ID, FIELD_Name, FIELD_Email, FIELD_Salutation];

const NEW_CONTACT_VALUE = '7';

export default class EmailPersonPointEdit extends LightningElement {

    contactList = [];

    @track
    contactPersons;
    
    contactPerson;

    fullName = '';

    editContactPerson = {};
    selectedPurposeItems;
    selectedLobItems;

    expand = false;
    contactOpen = false;

    apiName = 'Contact';
    listViewApiName = 'AllContacts';

    recordId;

    @track objectInfo;

    

    constructor(){
        super();
        this.generatePersonItems();
        // if(this.contactPerson){
        //     this.changeContact(contactPerson);
        // }
    }

    @wire(getObjectInfo, { objectApiName: CONTACT_OBJECT })
    wire_objectInfo({error, data}){
        if (data){
            this.objectInfo = data;
            this.recordId = this.recordTypeId;
        }else if (error){
            console.error(error);
        }
    }

    get recordTypeId() {
        // Returns a map of record type Ids 
        const rtis = this.objectInfo.recordTypeInfos;
        return Object.keys(rtis).find(rti => rtis[rti].name === 'Master');
    }

    @wire(getPicklistValues, { recordTypeId: '$recordId', fieldApiName: FIELD_Salutation })
    wire_getPicklistValues({error,data}){
        if (data){
            console.log(JSON.parse(JSON.stringify(data)));
        }else if (error){
            this.error = error;
            console.error(error);
        }
    }

    @wire(getListUi,{objectApiName:'$apiName',listViewApiName:'$listViewApiName',pageSize:100})
      wiredGetListUi({error,data}) {
          this.contactList = [];
          if(data) {
             this.error = undefined;
            if (data && data.records && data.records.records){
                data.records.records.forEach(e=>{
                    this.contactList.push(JSON.parse(JSON.stringify(e)));
                });
            }
        } else if(error) {
            this.error = error;
            console.log(error);
        }
        this.generatePersonItems();
    }

    changeContact(contactPerson){
        this.editContactPerson.lab = this.getFieldValue(contactPerson, 'Lab__c');
        this.editContactPerson.purpose = this.getFieldValue(contactPerson, 'Purpose__c');
        this.editContactPerson.Id = this.getFieldValue(contactPerson, 'Id');
        this.editContactPerson.Email = this.getFieldValue(contactPerson, 'Email');
        this.fullName = this._getDisplayValue(contactPerson, FIELD_Name);
        this.updatePurposePill();
        this.updateLobPill();
    }

    @api
    get items(){
        return this.contactPersons;
    }

    changeExpand(){
        this.expand =!this.expand;
    }

    changePurpose(event){

        if (this.editContactPerson) {
            this.editContactPerson.purpose = event.detail.value;
        }
        this.updatePurposePill();
    }

    updatePurposePill(){
        this.selectedPurposeItems = null;
        if(this.editContactPerson.purpose){
            this.selectedPurposeItems = [
                {
                    label: this.editContactPerson.purpose,
                    name: 'Primary'
                }
            ];
        }
    }

    handlePurposeItemRemove(event){
        var name = event.detail.item.label;
        this.selectedPurposeItems = this.selectedPurposeItems.filter(item=>{
            return item.label != name;
        });
    }

    changeLOB(event){
        if (this.editContactPerson) {
            this.editContactPerson.lob = event.detail.value;
        }
        this.updateLobPill();
    }

    updateLobPill(){
        this.selectedLobItems = null;
        if(this.editContactPerson.lob){
            this.selectedLobItems = [
                {
                    label: this.editContactPerson.lob,
                    name: this.editContactPerson.lob
                }
            ];
        }
    }


    handleLobItemRemove(event){
        var name = event.detail.item.label;
        this.selectedLobItems = this.selectedLobItems.filter(item=>{
            return item.label != name;
        });
    }

    handleChangeContact(e){
        let value = e.detail.value;
        let person = this.contactList.find(c=>{return this.getFieldValue(c, 'Id') == value});
        let old;
        if (this.editContactPerson){
            old = this.contactList.find(c=>{return this.getFieldValue(c, 'Id') == this.editContactPerson.Id});
        }
        
        if(person){
            this.changeContact(person);
        }

        this.dispatchEvent(new CustomEvent('changecontact', {
            bubbles: true,
            composed: true,
            detail:{
                contact1:{
                    Id:this.getFieldValue(person, 'Id'),
                    Eamil:this.getFieldValue(person, 'Email'),
                    Name:this.getFieldValue(person, 'Name'),
                    FirstName:this.getFieldValue(person, 'Name')
                },
                contact:person,
                new:value == NEW_CONTACT_VALUE,
                oldcontact:old
            }
        }))
    }

    handleNewContact(event){
        if (event.detail.submit) {
            console.log(event.detail.contact);
            this.contactList.push(event.detail.contact);
            this.generatePersonItems();
        }
        this.newContactPerson = false;

    }

    generatePersonItems(){
        if(!this.contactList){
            return;
        }
        this.contactPersons = this.contactList.map((item)=>{
            return this.processContactPerson(item);
        })
        this.contactPersons.push(this.getNonContactPerson());
    }

    processContactPerson(contact){
        return {text:this._getDisplayValue(contact, FIELD_Name),
        value:this.getFieldValue(contact, 'Id'),
        type:"option-inline",
        email: this.getFieldValue(contact, 'Email'),
        data:contact};
    }

    getLabel(contact){
        let str = '';
        if(this.getFieldValue(contact, 'Salutation')){
            str += (this.getFieldValue(contact, 'Salutation') + ' ');
        }
        if(this.getFieldValue(contact, 'LastName')){
            str += (this.getFieldValue(contact, 'LastName') + ' ');
        }
        if(this.getFieldValue(contact, 'FirstName')){
            str += (this.getFieldValue(contact, 'FirstName') + ' ');
        }
        return str || this.getFieldValue(contact, 'Name');
    }

    getFieldValue(contact, field){
        if (!contact || !contact.fields) {
            return null;
        }
        return contact.fields[field] ? contact.fields[field].value : null;
    }

    getNonContactPerson(){
        return {text:'Add New Contact Person',value:NEW_CONTACT_VALUE, id:'7', type:"option-card",iconName:'utility:add',iconSize:'xx-small', checked:true};
    }


    addContact(){
        this.contactOpen = true;
    }

    closeAddRecipient(){
        this.dispatchEvent(new CustomEvent('updateRecipient', {
            bubbles: true,
            composed: true,
            detail:{
                id:this.editContactPerson.id,
                purpose:this.editContactPerson.purpose,
                lob:this.editContactPerson.lob
            }
        }))
    }

    handleCancel(){
        this.dispatchEvent(new CustomEvent('changecontactinfo', {
            bubbles: true,
            composed: true,
            detail:{
                new:false,
                submit:false,
                contact:this.editContactPerson
            }
        }))

    }

    handleSubmit(){
        this.dispatchEvent(new CustomEvent('changecontactinfo', {
            bubbles: true,
            composed: true,
            detail:{
                new:false,
                submit:true,
                contact:this.editContactPerson
            }
        }))

    }

    get allowSubmit(){
        return this.editContactPerson && !this.editContactPerson.purpose;
    }

    _getDisplayValue(data, field) {
		return getFieldDisplayValue(data, field) ? getFieldDisplayValue(data, field) : getFieldValue(data, field);
	}
}