import { LightningElement, api, wire, track} from 'lwc';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import { getObjectInfo, getPicklistValues} from 'lightning/uiObjectInfoApi';
import { getListUi } from 'lightning/uiListApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
    _displayContactItems;
    
    contactPerson;

    fullName = '';

    editContactPerson = {};
    selectedPurposeItems;
    selectedLobItems;

    _expand = true;
    contactOpen = false;

    apiName = 'Contact';
    listViewApiName = 'AllContacts';

    selectedRecordId;

    @api
    newEmail;

    constructor(){
        super();
        this.generatePersonItems();
    }

    @wire(getListUi,{objectApiName:'$apiName',listViewApiName:'$listViewApiName',pageSize:1000})
    wiredGetListUi({error,data}) {
          this.contactList = [];
          if(data) {
             this.error = undefined;
            if (data && data.records && data.records.records){
                data.records.records.forEach(e=>{
                    this.contactList.push(JSON.parse(JSON.stringify(e)));
                });
            }
            this.generatePersonItems();
        } else if(error) {
            this.errorHandler(error);
        }
    }

    changeContact(contactPerson){
        this.editContactPerson.lab = this.getFieldValue(contactPerson, 'Lab__c');
        this.editContactPerson.purpose = this.getFieldValue(contactPerson, 'Purpose__c');
        this.editContactPerson.Id = this.getFieldValue(contactPerson, FIELD_ID.fieldApiName);
        this.editContactPerson.Email = this.getFieldValue(contactPerson, FIELD_Email.fieldApiName);
        this.fullName = this._getDisplayValue(contactPerson, FIELD_Name);
        this.updatePurposePill();
        this.updateLobPill();
    }

    @api
    get items(){
        return this._displayContactItems;
    }
    

    changeExpand(){
        //this._expand =!this._expand;
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
        let selectedValue = e.detail.value;
        let newPerson = this.contactList.find(c=>{return this.getFieldValue(c, 'Id') == selectedValue});
        let oldPerson;
        if (this.editContactPerson){
            oldPerson = this.contactList.find(c=>{return this.getFieldValue(c, 'Id') == this.editContactPerson.Id});
        }
        
        if(newPerson){
            this.selectedRecordId = getFieldValue(newPerson, FIELD_ID);
            this.changeContact(newPerson);
        }else{
            this.selectedRecordId = null;
        }

        this.dispatchEvent(new CustomEvent('changecontact', {
            bubbles: true,
            composed: true,
            detail:{
                contact: newPerson,
                new: selectedValue == NEW_CONTACT_VALUE,
                oldcontact: oldPerson
            }
        }))
    }

    generatePersonItems(){
        this._displayContactItems = (this.contactList||[]).map((item)=>{
            return this.processContactPerson(item);
        })
        this._displayContactItems.push(this.getNonContactPerson());
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
        return {text:'Add New Contact Person',value:NEW_CONTACT_VALUE, id:NEW_CONTACT_VALUE, type:"option-card",iconName:'utility:add',iconSize:'xx-small', checked:true};
    }


    addContact(){
        this.contactOpen = true;
    }

    handleButtonClick(event){
        
        let name = event.target.name;
        if (name==='ok'){
            this.saveContactInfo();
        }else{
            this.dispatchEvent(new CustomEvent('changecontactinfo', {
                bubbles: true,
                composed: true,
                detail:{
                    new: false,
                    submit: name==='ok',
                    contact: this.editContactPerson
                }
            }))

        }

    }
    saveContactInfo(){
        const fields = {};
        if(!this.selectedRecordId){
            return;
        }
        const allValid = [...this.template.querySelectorAll('lightning-input')]
        .reduce((validSoFar, inputFields) => {
            inputFields.reportValidity();
            return validSoFar && inputFields.checkValidity();
        }, true);

        fields[FIELD_Salutation.fieldApiName] = this.editContactPerson.Salutation;
        if(this.newEmail){
            fields[FIELD_Email.fieldApiName] = this.newEmail;
        }
        // fields[FIELD_Lob.fieldApiName] = this.editContactPerson.Lob;
        // fields[FIELD_Purpose.fieldApiName] = this.editContactPerson.Purpose;

        fields[FIELD_ID.fieldApiName] = this.selectedRecordId;
        let recordInput = { fields };
        updateRecord(recordInput)
            .then(data => {
                this.resultHandler(data, `Contact ${data.id} was updated`);
            })
            .catch(error => this.errorHandler(error, this));
        
    }

    resultHandler(newContact, msg) {
        this._expand = false;
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        this.showToast('Success', msg, 'success');

        this.dispatchEvent(new CustomEvent('changecontactinfo', {
            bubbles: true,
            composed: true,
            detail:{
                new:false,
                submit:true,
                contact:newContact
            }
        }));
    }

    errorHandler(error) {
        this.isLoading = false;
        console.error(error);
        const errorMessage = this.reduceErrors(error);
        // this.versionId = "";
        this.showToast('Error creating record', `${errorMessage}`, 'error');
    }

     /**
     * Reduces one or more LDS errors into a string[] of error messages.
     * @param {FetchResponse|FetchResponse[]} errors
     * @return {String[]} Error messages
     */
      reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }

        return (
            errors
                // Remove null/undefined items
                .filter((error) => !!error)
                // Extract an error message
                .map((error) => {
                    // UI API read errors
                    if (Array.isArray(error.body)) {
                        return error.body.map((e) => e.message);
                    }
                    //validation Error
                    else if (error.body && error.body.output && error.body.output.errors && Array.isArray(error.body.output.errors) && error.body.output.errors.length > 0) {
                        return error.body.output.errors.map((e) => e.message);
                    }

                    //field Errors
                    else if (error.body && error.body.output && error.body.output.fieldErrors && Object.keys(error.body.output.fieldErrors).length > 0) {
                        for (const [_, value] of Object.entries(error.body.output.fieldErrors)) {
                            let [{ message }] = value;
                            return message;
                        }                       
                    }

                    // UI API DML, Apex and network errors
                    else if (error.body && typeof error.body.message === 'string') {
                        return error.body.message;
                    }
                    // JS errors
                    else if (typeof error.message === 'string') {
                        return error.message;
                    }
                    // Unknown error shape so try HTTP status text
                    return error.statusText;
                })
                // Flatten
                .reduce((prev, curr) => prev.concat(curr), [])
                // Remove empty strings
                .filter((message) => !!message)
        );
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
            })
        );
    }

    get disableSubmitBtn(){
        return !this.editContactPerson || !this.editContactPerson.purpose || !this.newEmail || !this.selectedRecordId;
    }

    _getDisplayValue(data, field) {
        return getFieldDisplayValue(data, field) ? getFieldDisplayValue(data, field) : getFieldValue(data, field);
    }
}