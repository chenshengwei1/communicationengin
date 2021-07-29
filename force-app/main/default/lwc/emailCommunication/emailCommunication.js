import { LightningElement, api, wire, track } from 'lwc';
import id from '@salesforce/user/Id';
import { getRecord, getFieldValue, getFieldDisplayValue} from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getListUi } from 'lightning/uiListApi';


import getTemplateDetails from '@salesforce/apex/EmailCommunicationController.getTemplateDetails';
import sendEmail from '@salesforce/apex/ce_EmailController.sendEmail';
import upload from '@salesforce/apex/ce_DmsAttachmentController.upload';
import download from '@salesforce/apex/ce_DmsAttachmentController.download';



import CONTACT_OBJECT from '@salesforce/schema/Contact';
import FIELD_Name from '@salesforce/schema/Contact.Name';
import FIELD_Email from '@salesforce/schema/Contact.Email';
import FIELD_Id from '@salesforce/schema/Contact.Id';
import FIELD_ACCOUNT_ID from '@salesforce/schema/Contact.Account.Id';

import USER_NAME_FIELD from '@salesforce/schema/User.Name';
import USER_EMAIL_FIELD from '@salesforce/schema/User.Email';
import USER_ID_FIELD from '@salesforce/schema/User.Id';
import USER_CONTACT_FIELD from '@salesforce/schema/User.Contact.Name';


const userfields = [USER_NAME_FIELD, USER_EMAIL_FIELD, USER_ID_FIELD, USER_CONTACT_FIELD];

const natureItems = [{value:'Enquiry', label:'Enquiry'},{value:'Survey', label:'Survey'},{value:'Invoice', label:'Invoice'},{value:'Campaign', label:'Campaign'}];

const FILE_TYPE = ['PDF','PNG','JPEG'];

const MAX_FILE_SIZE = 6*1024*1024;

const MAX_FILE_NUMBER = 100;

const MAX_SINGLE_FILE_SIZE = 6*1024*1024;

const CC_BCC_DOMAIN = ['hkt.com', 'pccw.com', 'hkcsl.com'];

const MAX_SUBJECT_LENGTH = 2048;

const MAX_HTMLBODY_LENGTH = 4096;

const BUTTON_STATUS_OK = 'ok';

const TOAST = {SUCCESS: {VARIANT: 'success', TITLE:'Success'}, ERROR: {VARIANT: 'error', TITLE:'Error'}};


export default class EmailCommunication extends LightningElement {
    
    @track
    contacts = [];
    currentTeams = [];

    showPreview;

    @track
    showAttachmentPill;

    @track
    attachmentPillItems;

    
    showEmailTemplate;

    @api
    recipients = [];
    
    userId = id;

    @api 
    recordId;

    @track
    error;

    @track selectedFromContactId = '';

    selectedToContactId = '';

    selectedDeliveryId = '';

    // who revicer eamils
    @track recipientcontacts = '';

    @track emailSubject = '';

    @track emailHtmlbody = '';

    isButtonDisabled = true;
    contactObjectData;

    @track showcc = false;
    @track showbcc = false;

    @track emailContent;

    @api whatId;

    @api whoId;

   

    templateId;

    attactmentList = [];

    @wire(getRecord, { recordId: '$userId', fields: userfields})
    wired_currentUser({error, data}){
        this.currentTeams = [];
        if(data){
            this.currentTeams.push({
                value: getFieldValue(data, USER_NAME_FIELD),
                label: getFieldValue(data, USER_NAME_FIELD)+' <'+getFieldValue(data, USER_EMAIL_FIELD) +'>',
                email:getFieldValue(data, USER_EMAIL_FIELD),
                id:getFieldValue(data, USER_ID_FIELD)
            });

            this.selectedFromContactId = getFieldValue(data, USER_NAME_FIELD);
        }else if (error){
            this.handleError(error);
        }
    };

    @wire(getListUi,{objectApiName: CONTACT_OBJECT.objectApiName,listViewApiName:'AllContacts',pageSize:1000})
    wiredGetListUi({error,data}) {
          this.contacts = [];
          if(data) {
             this.error = undefined;
            if (data && data.records && data.records.records){
                this.contactObjectData = data.records.records;
                this.updateContactList(data.records.records);
            }
        } else if(error) {
            this.error = error;
            console.log(error);
        }
    }

    updateContactList(contacts){
        for(var s of contacts){
            let itemAccountId = getFieldValue(s,FIELD_ACCOUNT_ID);
            if (!itemAccountId){
                continue;
            }
            if (this.accountRecordId){
                if (this.accountRecordId !== itemAccountId){
                    continue;
                }
            }
            let email = getFieldValue(s, FIELD_Email);
            if (email){
                this.contacts.push({
                    value:getFieldValue(s, FIELD_Id),
                    label:this._getDisplayValue(s, FIELD_Name) ? this._getDisplayValue(s, FIELD_Name)+' <'+this._getDisplayValue(s, FIELD_Email) +'>':this._getDisplayValue(s, FIELD_Email),
                    email:getFieldValue(s, FIELD_Email),
                    name:getFieldValue(s, FIELD_Name)
                })
            }
        }
        this.contacts.sort((a,b)=>{
            return String(a.label).localeCompare(String(b.label));
        });

        //this.recipientcontacts = this.contacts.map(e=>{return e.value});
    }

    renderedCallback(){
        let section = this.template.querySelector('.ce-email-recipient');
        if(this.recipients.length == 0){
            section.classList.add('slds-hide');
        }else{
            section.classList.remove('slds-hide');
        }
        
        let buttonlayoutItem = this.template.querySelector('.ce-email-cc__button');
        this.showcc && this.showbcc ? buttonlayoutItem.classList.add("slds-hide") : buttonlayoutItem.classList.remove("slds-hide");
    }

    handleError(error){
        this.error = 'Unknown error';
        if (error.body){
            if (Array.isArray(error.body)) {
                this.error = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                this.error = error.body.message;
            }
        }else if(error.error){
            if (typeof error.error.message === 'string') {
                this.error = error.error.message;
            }
        }
    }

    @api 
    get accountRecordId(){
        return this._accountRecordId;
    }

    set accountRecordId(value){
        this._accountRecordId = value;
        if (this._accountRecordId && this.contactObjectData){
            this.contacts = [];
            this.updateContactList(this.contactObjectData);
        }
    }

    get natures(){
        return natureItems;
    }

    get acceptfile(){
        return FILE_TYPE.map(e=>{return '.' + e;}).join(',');
    }

    set options(value){
        if (value){
            if (value.template){
                this.folderNames = (value.template.filters||[]).map(f=>{
                    return f.folderName;
                })
            }
        }
    }

    @api
    get options(){
        return {};
    }

    onSendEmailFromChange(event){
        this.selectedFromContactId = event.target.value;
    }

    changeNature(event){
        this.emailNature = event.target.value;
    }

    changeCcemail(event){
        this.ccemail = event.detail.value;
    }

    changeBccemail(event){
        this.bccemail = event.detail.value;
    }

    onSubjectChange(event){
        this.emailSubject = event.target.value;
    }

    onDescriptionChange(event){
        this.emailHtmlbody = event.target.value;
    }

    onClickCC(event){
        this.showcc = true;
    }

    onClickBCC(event){
        this.showbcc = true;
    }

    onChangeSensitive(event){
        this.sensitive = event.detail.checked;
    }

    handlePurposeOfContactChange(event){
        this.recipientcontacts = event.detail.value;
        console.log(event.detail);
    }

    handleInsertTemplate(event){
        console.log('open Insert Template dialog');
        this.showEmailTemplate = true;
        
    }

    changeContact(event){
        //var r = this.template.querySelector('c-email-recipient').getRecipient();
        //console.log(r);
        this.updateRecipientInfos();
    }

    updateRecipientInfos(){
        let contacts  = this.recipients.filter(e=>{
            let selector = this.template.querySelector(`[data-id="${e.id}"]`);
            return selector && selector.recipient && selector.email;
        }).map(e=>{
            let selector = this.template.querySelector(`[data-id="${e.id}"]`);
            return selector.recipient;
        });
    }

    addRecipient(event){
        let oldRecipients = this.recipients;
        this.recipients = [];
        oldRecipients.forEach((item)=>{
            this.recipients.push(item);
        });
        this.recipients.push({id: Math.floor(Math.random()*1000)
        })
    }

    closeAddRecipient(event){
        let oldRecipients = this.recipients;
        //this.recipients = [];
        this.recipients = oldRecipients.filter((item)=>{
            return item.id != event.detail.id
        });
        this.updateRecipientInfos();
    }

    getAllToAddresses(){
        let allAddress = [];
        if (this.recipientcontacts){
            allAddress = this.recipientcontacts.map(e=>{
                let contactInfo = this.contacts.find(c =>{return c.value == e});
                return {email:contactInfo.email, name:contactInfo.name, id:e, emailLabel:contactInfo.label};
            });
        }

        let extendRecipients = this.recipients.filter(e=>{
            let selector = this.template.querySelector(`[data-id="${e.id}"]`);
            return selector && selector.recipient && selector.email;
        }).map(e=>{
            let selector = this.template.querySelector(`[data-id="${e.id}"]`);
            return {email:selector.email, name:selector.name, id:getFieldValue(selector.recipient, FIELD_Id)};
        });

        allAddress.push(...extendRecipients);
        return allAddress;
    }

    generateEmailInfo(){
        let fromContact = this.currentTeams.find((contact)=>{
            return contact.value == this.selectedFromContactId;
        });
    
        if (!fromContact){
            console.error('Not any sender.');
            return;
        }
        let toAddresses = this.getAllToAddresses();
        let ccAddresses = this.ccemail && this.ccemail.split(';').filter(e=>e).map(e=>{
            let match = e.match(/<?([\w\d_\.]+@[\w\d_\.]+)>?/);
            if (match){
                let name = e.substring(0,e.indexOf('<'));
                return {name:name,email:match[1]}
            }
            return {email:e}
        });
        let bccAddresses = this.bccemail && this.bccemail.split(';').filter(e=>e).map(e=>{
            let match = e.match(/<?([\w\d_\.]+@[\w\d_\.]+)>?/);
            if (match){
                let name = e.substring(0,e.indexOf('<'));
                return {name:name,email:match[1]}
            }
            return {email:e}
        });
        let ce_EmailInfo = {
            personalizations:[{
                toAddresses,
                ccAddresses,
                bccAddresses,
                subject:this.emailSubject
            }],
            fromAddress:{
                email:fromContact.email,
                name:fromContact.value,
            },
            content:{
                type:'text/html',
                value:this.emailHtmlbody
            },
            attachments:this.attactmentList,
            natures:this.emailNature?[this.emailNature]:[],
            htmlBody:this.emailHtmlbody,
            templateId:this.templateId,
            sensitive:this.sensitive,
            subject:this.emailSubject
        }

        this.emailContent = ce_EmailInfo;
        return ce_EmailInfo;
    }

    render4Template(emailInfo, templateId){
        return new Promise((resolve, error)=>{
            let toAddresses = this.getAllToAddresses();

            // render template email
            if (templateId && toAddresses && toAddresses[0] && toAddresses[0].id){
                getTemplateDetails({
                    templateId:templateId,
                    whoId:toAddresses[0].id,
                    whatId:null
                }).then(emailMesasge=>{
                    emailInfo.content.value = emailMesasge.body;
                    emailInfo.subject = emailMesasge.subject;
                    emailInfo.personalizations.forEach(e=>{
                        e.subject = emailMesasge.subject;
                    });
                    this.emailContent = emailInfo;
                    resolve(emailInfo);
                }).catch(e=>{
                    this.handleError(e);
                    this.showToast(TOAST.ERROR.TITLE, 'Render email template failure.' + e, TOAST.ERROR.VARIANT);
                    error(emailInfo);
                })
            }else{
                resolve(emailInfo);
            }
        })
    }

    /**
     * check email info input valid or not.
     * @returns true/false
     */
    validInputBeforePreview(){
        let errorMessages = [];

        // to address
        let allRecipients = this.getAllToAddresses();
        if (!allRecipients || allRecipients.length == 0){
            errorMessages.push('You must choose at least one recipient.');
        }

        // cc address
        if (this.ccemail){
            let ccRecipients = this.ccemail.split(';').filter(e=>e);
            for(let ccRecipient of ccRecipients){
                let match = ccRecipient.match(/<?([\w\d_\.]+@[\w\d_\.]+)>?/);
                if (match){
                    let name = ccRecipient.substring(0,ccRecipient.indexOf('<'));
                    let emailAddr = match[1];
                    let index = emailAddr.indexOf('@');
                    let emailDomain = emailAddr.substring(index+1);
                    if (CC_BCC_DOMAIN.indexOf(emailDomain) == -1){
                        errorMessages.push(`${emailDomain} is not a valid cc email domain.`);
                    }
                    if (emailAddr.length > 255){
                        errorMessages.push(`cc address exceeds 256 characters`);
                    }
                }else{
                    errorMessages.push(`${ccRecipient} is not a valid email.`);
                }
            }

        }

        // bcc address
        if (this.bccemail){
            let bccRecipients = this.bccemail.split(';').filter(e=>e);
            for(let bccRecipient of bccRecipients){
                let match = bccRecipient.match(/<?([\w\d_\.]+@[\w\d_\.]+)>?/);
                if (match){
                    let name = bccRecipient.substring(0,bccRecipient.indexOf('<'));
                    let emailAddr = match[1];
                    let index = emailAddr.indexOf('@');
                    let emailDomain = emailAddr.substring(index+1);
                    if (CC_BCC_DOMAIN.indexOf(emailDomain) == -1){
                        errorMessages.push(`${emailDomain} is not a valid cc email domain.`);
                    }
                    if (emailAddr.length > 256){
                        errorMessages.push(`cc address exceeds 256 characters`);
                    }
                }else{
                    errorMessages.push(`${ccRecipient} is not a valid email.`);
                }
            }

        }

        // attachment
        if (this.attactmentList && this.attactmentList.length>0){
            let totalSize = 0;
            if (this.attactmentList.length>MAX_FILE_NUMBER){
                errorMessages.push(`Attachements exceeds max ${MAX_FILE_NUMBER} files limit.`);
            }
            for(let attactment of this.attactmentList){
                totalSize += attactment.size;
                if (attactment.size > MAX_SINGLE_FILE_SIZE){
                    errorMessages.push(`There is single file size ${Math.ceil(MAX_SINGLE_FILE_SIZE/(1024*1024))}MB upload limit.`);
                }
                
            }
            if (this.validFilesType(this.attactmentList.map(e=>{return {name:e.filename}}), FILE_TYPE)){
                errorMessages.push(`Only [${FILE_TYPE.join(',')}] file can be supported.`);
            }
            if (totalSize > MAX_FILE_SIZE){
                errorMessages.push(`Attachements exceeds ${Math.ceil(MAX_FILE_SIZE/(1024*1024))}MB limit.`);
            }
        }

        // subject
        if (!this.emailSubject){
            errorMessages.push(`Subject can not be emtpy.`);
        }else{
            if (this.emailSubject.length > MAX_SUBJECT_LENGTH){
                errorMessages.push(`Subject is too long.`);
            }
        }

        // html body
        if (!this.emailHtmlbody){
            errorMessages.push(`HTML body can not be emtpy.`);
        }else{
            if (this.emailHtmlbody.length > MAX_HTMLBODY_LENGTH){
                errorMessages.push(`HTML body is too long.`);
            }
        }

        if (errorMessages.length){
            //alert(errorMessage);
            this.showToast(TOAST.ERROR.TITLE, errorMessages.join('\n'), TOAST.ERROR.VARIANT);
            return false;
        }
        return true;
    }

    /**
     * generate email info to preview
     * @param {*} event 
     * @returns 
     */
    handlePreview(event){
        if (!this.validInputBeforePreview()){
            return;
        }
        this.render4Template(this.generateEmailInfo(), this.templateId).then((emailInfo)=>{
            this.showPreview = true;
        });
    }

    /**
     * click send email and call apex API callout
     * @param {*} event 
     */
    handleSendEmail(event){
        this.showPreview = false;
        if (event.detail.status == BUTTON_STATUS_OK){
            this.render4Template(this.generateEmailInfo(), this.templateId).then((emailInfo)=>{
                sendEmail({emailInfoString:JSON.stringify(emailInfo)}).then((e)=>{
                    if(e!=null){
                        this.showToast(TOAST.SUCCESS.TITLE, 'Send email success.', TOAST.SUCCESS.VARIANT);
                    }else{
                        this.showToast(TOAST.ERROR.TITLE, 'Send email failure.', TOAST.ERROR.VARIANT);
                    }
                }).catch((e)=>{
                    /**
                     * eg:
                     * {
                            "status" : 500,
                            "error": {
                                "code": "CE_ERROR_001", #example
                                "message": "Server connect timeout",
                                "details": "SMTP Server connect timeout"
                            },
                            "timestamp": "2020-07-16T22:14:45.624+0800"
                        }
                     */
                    this.handleError(e);
                    this.showToast(TOAST.ERROR.TITLE, this.error, TOAST.ERROR.VARIANT);
                });
            });
            
        }
    }

    /**
     * close 'email preview' componment
     */
    hiddenPreview(){
        this.showPreview = false;
        this.showEmailTemplate = false;
    }

    /**
     * close 'Email Template' dialog and update email info
     * @param {*} event 
     */
    handleTemplateSelectClose(event){
        this.showEmailTemplate = false;
        if(event.detail.status == BUTTON_STATUS_OK && event.detail.templates){
            let templateList = event.detail.templates;
            this.insertEmailTemplate(templateList[0]);
        }
    }

    /**
     * update UI information when email tempalte was selected, include htmlbody, subject, attachments
     * @param {*} template 
     */
    insertEmailTemplate(template){
        this.templateId = template.Id;
        this.emailHtmlbody = template.HtmlValue || template.Body;
        this.emailSubject = template.Subject;
        //this.whatId = this.whatId || null;
        //this.whoId = this.whoId || null;

        if (template.fileattachments){
            this.attactmentList = fileattachments.map(e=>{
                return {
                    base64Content:'',
                    filename:e.fileName,
                    type:'pdf',
                    fileId:e.attachId
                }
            })
        }else{
            this.attactmentList = [];
        }
        this.updateAttachmentPillItems();

        console.log('whatId: ' +this.whatId + ', whoId:' + this.whoId );
    }

    /**
     * add a attachment file when file was selected or drag
     * @param {*} event 
     * @returns 
     */
    handleFilesChange(event){
        var files = event.target.files;
     
        var testFile = files[0];
        if (!testFile){
            alert("Select at least one file and upload, please.");
            return;
        }

        // not support same name file
        let existsNames = this.attactmentList.map(attactment=>{
            return attactment.filename;
        })

        for(let file of files){
            if (existsNames.indexOf(file.name) != -1){
                alert(`File ${file.name} already exists`);
                return;
            }
        }

        // check upload files size
        if (this.validFilesSize(files, MAX_FILE_SIZE)){
            alert("Total max size 6MB file.");
            return;
        }

        // check upload files type
        if (this.validFilesType(files, FILE_TYPE)){
            alert(`Only [${FILE_TYPE.join(',')}] file can be supported.`);
            return;
        }

        for (let file of files){
            this.readFilecontents(file).then((content)=>{
                upload({fileName:file.name, fileContent:content}).then(resp=>{
                    if (resp && resp.status == 0){
                        let attachmentInfo = {
                            base64Content:content,
                            filename:file.name,
                            type:'pdf',
                            fileId:'',
                            size:file.size,
                            id: Math.floor(Math.random()*1000)
                        };
                        this.attactmentList.push(attachmentInfo);
                        this.handleUploadFileChange(attachmentInfo, 'add');
                        this.showToast(TOAST.SUCCESS.TITLE, 'Upload file success.', TOAST.SUCCESS.VARIANT);
                    }else if (resp){
                        this.showToast(TOAST.ERROR.TITLE, resp.message, TOAST.ERROR.VARIANT);
                    }
                }).catch(e=>{
                    this.showToast(TOAST.ERROR.TITLE, e, TOAST.ERROR.VARIANT);
                });
            }).catch(e=>{
                this.showToast(TOAST.ERROR.TITLE, e, TOAST.ERROR.VARIANT);
            });
        }
    }

    validFilesSize(files, totalMaxFileSize){
        let totalUploadSize = 0;
        this.attactmentList.forEach(e=>{
            totalUploadSize += (e.size || 0);
        });
        for(let file of files){
            totalUploadSize += file.size;
        }
        return totalMaxFileSize <= totalUploadSize;
    }

    validFilesType(files, support){
        
        let s = support.join('|');
        let regExp = new RegExp(`\.(${s})$`,'ig');
        for(let file of files){
            if (!regExp.test(file.name)){
                return true;
            }
        }
        return false;
    }

    readFilecontents(file){
        return new Promise((resolve, error)=>{
            var fileReader = new FileReader();
            fileReader.onloadend = (e)=>{
                let fileContents = fileReader.result;
                resolve(window.btoa(fileContents));
            }
            fileReader.onerror = function(e) {
                error("upload failed，try again.");
            }
            fileReader.onabort = function(e) {
                error("upload failed，try again.");
            }
        
            fileReader.readAsBinaryString(file);  
        })
    }

    /**
     * remove attachment file
     * @param {*} event 
     */
    handleFileItemRemove(event){
        var attactmentId = event.detail.item.id;
        let attachmentInfo = this.attactmentList.find(item=>{
            return item.id == attactmentId;
        });
        this.attactmentList = this.attactmentList.filter(item=>{
            return item.id != attactmentId;
        });
        
        this.handleUploadFileChange(attachmentInfo, 'remove');
    }

    /**
     * do something code when add or remove attachment file
     */
    handleUploadFileChange(attachmentInfo, action){
        this.updateAttachmentPillItems();
        this.showAttachmentPill = this.attactmentList.length > 0;

        this.dispatchEvent(
            new CustomEvent(
                'uploadfile',
                {
                    detail: {
                        files:[attachmentInfo],
                        action:action
                    }
                    
                }
            )
        );
    }

    /**
     * update UI items when attachment file change
     */
    updateAttachmentPillItems(){
        this.attachmentPillItems = this.attactmentList.map(e=>{
            let icon = e.filename.indexOf('.pdf')==-1 ?'doctype:pdf':'doctype:image';
            return {
                type: 'avatar',
                id: e.id,
                href: 'javascript:void(0);',
                label: e.filename,
                name: e.filename,
                src: '/docs/component-library/app/images/examples/avatar2.jpg',
                fallbackIconName: icon,
                alternativeText: e.filename
            }
        })
    }
    
    _getDisplayValue(data, field) {
		return getFieldDisplayValue(data, field) ? getFieldDisplayValue(data, field) : getFieldValue(data, field);
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
}