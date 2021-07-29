import { LightningElement, api,track,wire } from 'lwc';
import { generateRecordInputForCreate, getRecordCreateDefaults,createRecord } from 'lightning/uiRecordApi';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import getPicklist from '@salesforce/apex/EmailCommunicationController.getPicklist';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';

import FIELD_ID from '@salesforce/schema/Contact.Id';
import FIELD_Name from '@salesforce/schema/Contact.Name';
import FIELD_Email from '@salesforce/schema/Contact.Email';
import FIELD_FirstName from '@salesforce/schema/Contact.FirstName';
import FIELD_LastName from '@salesforce/schema/Contact.LastName';
import FIELD_Salutation from '@salesforce/schema/Contact.Salutation';


export default class EmailPersonPointNew extends LightningElement {

    isLoading = false;

    @track
    editContactPerson = {text:'', 
                    value:'1', 
                    id:'1', 
                    type:"option-inline",
                    FirstName:'',
                    LastName:'',
                    Salutation:'Mr.',
                    Lob:'',
                    Purpose:''};

    sexitems = [];

    selectedPurposeItems;

    selectedLobItems;

    @track
    _expand = true;
    detail = false;

    recordId;

    newEmail;
    
    @wire(getPicklist, {objName:CONTACT_OBJECT.objectApiName, fieldName:FIELD_Salutation.fieldApiName})
    wire_getPicklist({error, data}){
        if (data){
            console.log(JSON.stringify(data));
            let picklistMap = data.values;
            
            this.sexitems = Object.keys(picklistMap).map(key=>{
                return {text:picklistMap[key], value: key,type:"option-inline"};
            });
        }else if (error){
            console.error(error);
        }
    }

    @wire(getRecordCreateDefaults, { objectApiName: CONTACT_OBJECT })
    contactCreateDefaults;

    get recordInputForCreate() {
        if (!this.contactCreateDefaults.data) {
            return undefined;
        }

        const contactObjectInfo = this.contactCreateDefaults.data.objectInfos[
            CONTACT_OBJECT.objectApiName
        ];
        const recordDefaults = this.contactCreateDefaults.data.record;
        const recordInput = generateRecordInputForCreate(
            recordDefaults,
            contactObjectInfo
        );
        return recordInput;
    }

    @api
    getContactPerson(){
        return this.editContactPerson;
    }

    changeExpand(){
        //this._expand =!this._expand;
    }

    changePurpose(event){
        this.selectedPurposeItems = null;
        if (this.editContactPerson) {
            this.editContactPerson.purpose = event.detail.value;
            if(this.editContactPerson.purpose){
                let purposeList = this.editContactPerson.purpose.split(';');
                this.selectedPurposeItems = purposeList.map(e=>{
                    return {
                        label: e,
                        name: e
                    }
                });
            }
        }

    }

    selectSalutation(event){
        this.editContactPerson.Salutation = event.detail.value;
    }

    changeLastName(event){
        var name = event.detail.value;
        this.editContactPerson.LastName = name;
    }

    changeFirstName(event){
        var name = event.detail.value;
        this.editContactPerson.FirstName = name;
    }

    handlePurposeItemRemove(event){
        var name = event.detail.item.label;
        //alert(name + ' pill was removed!');

        this.selectedPurposeItems = this.selectedPurposeItems.filter(item=>{
            return item.label != name;
        });
    }

    changeLOB(event){
        this.selectedLobItems = null;
        if (this.editContactPerson) {
            this.editContactPerson.lob = event.detail.value;
            if(this.editContactPerson.lob){
                let lobs = this.editContactPerson.lob.split(';');
                this.selectedLobItems =  lobs.map(e=>{
                    return {
                        label: e,
                        name: e
                    }
                });
            }
        }
    }

    handleLobItemRemove(event){
        var name = event.detail.item.label;
        this.selectedLobItems = this.selectedLobItems.filter(item=>{
            return item.label != name;
        });
    }

    closeAddRecipient(){
        
    }

    get disableSubmitBtn(){
        return !this.editContactPerson.purpose || !this.editContactPerson.FirstName || !this.newEmail;
    }

    handleButtonClick(event){
        event.preventDefault();
        const fields = {};
        let name = event.target.name;
        this._expand = false;
        if (name=='ok'){
            this.isLoading = true;
            const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputFields) => {
                inputFields.reportValidity();
                return validSoFar && inputFields.checkValidity();
            }, true);

            fields[FIELD_FirstName.fieldApiName] = this.editContactPerson.FirstName;
            fields[FIELD_LastName.fieldApiName] = this.editContactPerson.LastName;
            fields[FIELD_Salutation.fieldApiName] = this.editContactPerson.Salutation;
            if(this.newEmail){
                fields[FIELD_Email] = this.newEmail;
            }
            // fields[FIELD_Lob.fieldApiName] = this.editContactPerson.Lob;
            // fields[FIELD_Purpose.fieldApiName] = this.editContactPerson.Purpose;

            if (this.recordId) {
                fields[FIELD_ID.fieldApiName] = this.recordId;
                let recordInput = { fields };
                updateRecord(recordInput)
                    .then(data => {
                        this.resultHandler(data, `Contact ${data.id} was updated`);
                    })
                    .catch(error => this.errorHandler(error, this));
            }
            else{
                let recordInput = this.recordInputForCreate;
                recordInput.fields = fields;
                createRecord(recordInput).then(data => {
                    this.resultHandler(data, `Contact ${data.id} was created`);
                })
                .catch(error => this.errorHandler(error, this));
            }
        }else{
            this.dispatchEvent(new CustomEvent('changecontactinfo', {
                bubbles: true,
                composed: true,
                detail:{
                    new:true,
                    submit:name=='ok'
                }
            }))
        }
        
    }

    resultHandler(newContact, msg) {
        this.isLoading = false;
        this.recordId = newContact.id;
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
                new:true,
                submit:true,
                contact:newContact
            }
        }));
    }

    udpateFields(recordInput){
        const fields = recordInput.fields;
        fields[FIELD_FirstName.fieldApiName] = {"displayValue":null,"value":this.editContactPerson.FirstName};
        fields[FIELD_LastName.fieldApiName] = {"displayValue":null,"value":this.editContactPerson.LastName};

        return updateRecord(recordInput);
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

    errorHandler(error, context) {
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
}