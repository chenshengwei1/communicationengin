import { LightningElement, api, wire, track } from 'lwc';
import id from '@salesforce/user/Id';
import { getRecord, getFieldValue, getFieldDisplayValue} from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getTemplateDetails from '@salesforce/apex/EmailCommunicationController.getTemplateDetails';
import sendEmail from '@salesforce/apex/ce_EmailController.sendEmail';


import FIELD_Name from '@salesforce/schema/Contact.Name';
import FIELD_Description from '@salesforce/schema/Contact.Description';
import FIELD_Email from '@salesforce/schema/Contact.Email';
import FIELD_Phone from '@salesforce/schema/Contact.Phone';
import FIELD_Id from '@salesforce/schema/Contact.Id';

import USER_NAME_FIELD from '@salesforce/schema/User.Name';
import USER_EMAIL_FIELD from '@salesforce/schema/User.Email';
import USER_ID_FIELD from '@salesforce/schema/User.Id';
import USER_CONTACT_FIELD from '@salesforce/schema/User.Contact.Name';



const fields = [FIELD_Id, FIELD_Name, FIELD_Description, FIELD_Email, FIELD_Phone].map(f=>{return f.fieldApiName});

const userfields = [USER_NAME_FIELD, USER_EMAIL_FIELD, USER_ID_FIELD, USER_CONTACT_FIELD];

const natureItems = [{value:'Enquiry', label:'Enquiry'},{value:'Survey', label:'Survey'},{value:'Invoice', label:'Invoice'},{value:'Campaign', label:'Campaign'}];

const FILE_TYPE = ['PDF','PNG'];

const MAX_FILE_SIZE = 30*1024*1024;


export default class EmailCommunication extends LightningElement {
    
    @track
    contacts = [];
    currentTeams = [];

    @track
    showPreview;

    @track
    showAttachmentPill;

    @track
    attachmentPillItems;

    @track
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

    @track showcc = false;
    @track showbcc = false;

    @track emailContent;

    @api whatId;

    @api whoId;

    templateId;

    attractList = [];

    constructor(){
        super();
    }


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

    renderedCallback(){
        let section = this.template.querySelector('.ce-email-recipient');
        if(this.recipients.length == 0){
            section.classList.add('slds-hide');
        }else{
            section.classList.remove('slds-hide');
        }
        
        let buttonlayoutItem = this.template.querySelector('.ce-email-cc__button');
        if(!this.showcc && !this.showbcc){
            buttonlayoutItem.classList.add('slds-hide');
        }else{
            buttonlayoutItem.classList.remove('slds-hide');
        }
    }

    handleError(error){
        this.error = 'Unknown error';
        if (Array.isArray(error.body)) {
            this.error = error.body.map(e => e.message).join(', ');
        } else if (typeof error.body.message === 'string') {
            this.error = error.body.message;
        }
    }

    get natures(){
        return natureItems;
    }

    get acceptfile(){
        return FILE_TYPE.map(e=>{return '.' + e;}).join(',');
    }

    onSendEmailFromChange(event){
        this.selectedFromContactId = event.target.value;
    }

    changeNature(event){
        this.emailNature = event.target.value;
    }

    changeCcemail(event){
        this.ccemail = event.target.value;
    }

    changeBccemail(event){
        this.bccemail = event.target.value;
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
        console.log(event.detail);
    }

    handleInsertTemplate(event){
        console.log('Insert Template');
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
            return selector && selector.recipient && getFieldValue(selector.recipient, FIELD_Email);
        }).map(e=>{
            let selector = this.template.querySelector(`[data-id="${e.id}"]`);
            return selector.recipient;
        });

        this.contacts = [];
        for(var s of contacts){
            this.contacts.push({
                value:getFieldValue(s, FIELD_Id) || (Math.floor(Math.random()*1000)+''),
                label:this._getDisplayValue(s, FIELD_Name) ? this._getDisplayValue(s, FIELD_Name)+' <'+this._getDisplayValue(s, FIELD_Email) +'>':this._getDisplayValue(s, FIELD_Email),
                email:getFieldValue(s, FIELD_Email),
                name:getFieldValue(s, FIELD_Name)
            })
        }
        this.contacts.sort((a,b)=>{
            return String(a.label).localeCompare(String(b.label));
        });

        this.recipientcontacts = this.contacts.map(e=>{return e.value});
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

    updateEmailContent(){
        let fromContact = this.currentTeams.find((contact)=>{
            return contact.value == this.selectedFromContactId;
        });
    
        if (!fromContact){
            console.error('Not any sender.');
            return;
        }
        let toAddresses = this.contacts && this.contacts.map(e=>{
            return {name:e.name, email:e.email, id: e.value};
        });
        let ccAddresses = this.ccemail && this.ccemail.split(';').map(e=>{
            let match = e.match(/<?([\w\d_\.]+@[\w\d_\.]+)>?/);
            if (match){
                let name = e.substring(0,e.indexOf('<'));
                return {name:name,email:match[1]}
            }
            return {address:e}
        });
        let bccAddresses = this.bccemail && this.bccemail.split(';').map(e=>{
            let match = e.match(/<?([\w\d_\.]+@[\w\d_\.]+)>?/);
            if (match){
                let name = e.substring(0,e.indexOf('<'));
                return {name:name,email:match[1]}
            }
            return {address:e}
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
            attachments:this.attractList,
            natures:[this.emailNature],
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
            let toAddresses = this.contacts && this.contacts.map(e=>{
                return {name:e.name, email:e.email, id: e.value};
            });

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
                    this.showToast('Error', 'Reder email template failure.' + e, 'error');
                    error(emailInfo);
                })
            }else{
                resolve(emailInfo);
            }
        })
    }

    handlePreview(event){
        this.updateEmailContent();
        this.render4Template(this.updateEmailContent(), this.templateId).then((emailInfo)=>{
            this.showPreview = true;
        });
    }

    handleSendEmail(event){
        this.showPreview = false;
        if (event.detail.status=='ok'){
            this.updateEmailContent();
            this.render4Template(this.updateEmailContent(), this.templateId).then((emailInfo)=>{
                sendEmail({emailInfoString:JSON.stringify(emailInfo)}).then((e)=>{
                    if(e!=null){
                        this.showToast('Success', 'Send email success.', 'success');
                    }else{
                        this.showToast('Error', 'Send email failure.', 'error');
                    }
                }).catch((e)=>{
                    this.handleError(e);
                    this.showToast('Error', 'Send email failure.clause:' + e, 'error');
                });
            });
            
        }
    }

    hiddenPreview(){
        this.showPreview = false;
        this.showEmailTemplate = false;
    }

    handleTemplateSelectClose(event){
        this.showEmailTemplate = false;
        if(event.detail.status == 'ok' && event.detail.templates){
            let templateList = event.detail.templates;
            this.insertEmailTemplate(templateList[0]);
        }
    }

    insertEmailTemplate(template){
        this.templateId = template.Id;
        this.emailHtmlbody = template.HtmlValue || template.Body;
        this.emailSubject = template.Subject;
        //this.whatId = this.whatId || null;
        //this.whoId = this.whoId || null;

        if (template.fileattachments){
            this.attractList = fileattachments.map(e=>{
                return {
                    base64Content:'',
                    filename:e.fileName,
                    type:'pdf',
                    fileId:e.attachId
                }
            })
        }else{
            this.attractList = [];
        }
        this.updateAttachmentPillItems();

        console.log('whatId: ' +this.whatId + ', whoId:' + this.whoId );
    }

    callbackMessage(e){
        console.log(e.detail);
    }

    handleFilesChange(event){
        var files = event.target.files;
     
        var testFile = files[0];
        if (!testFile){
            alert("Select at least one file and upload, please.");
            return;
        }

        // check upload files size
        if (this.validFilesSize(files, MAX_FILE_SIZE)){
            alert("Total max size 30MB file.");
            return;
        }

        // check upload files type
        if (this.validFilesType(files, FILE_TYPE)){
            alert(`Only [${FILE_TYPE.join(',')}] file can be supported.`);
            return;
        }

        for (let file of files){
            this.readFilecontents(file).then((content)=>{
                let attachmentInfo = {
                    base64Content:content,
                    filename:file.name,
                    type:'pdf',
                    fileId:'',
                    size:file.size
                };
                this.attractList.push(attachmentInfo);
                this.handleUploadFileChange(attachmentInfo, 'add');
                this.showToast('Success', 'Upload file success.', 'success');
            }).catch(e=>{
                this.showToast('Error', e, 'error');
            });
        }
    }

    validFilesSize(files, totalMaxFileSize){
        let totalUploadSize = 0;
        this.attractList.forEach(e=>{
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

    handleFileItemRemove(event){
        var name = event.detail.item.label;
        let attachmentInfo = this.attractList.find(item=>{
            return item.filename == name;
        });
        this.attractList = this.attractList.filter(item=>{
            return item.filename != name;
        });
        
        this.handleUploadFileChange(attachmentInfo, 'remove');
    }

    handleUploadFileChange(attachmentInfo, action){
        this.updateAttachmentPillItems();
        this.showAttachmentPill = this.attractList.length > 0;

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

    updateAttachmentPillItems(){
        this.attachmentPillItems = this.attractList.map(e=>{
            let icon = e.filename.indexOf('.pdf')==-1 ?'doctype:pdf':'doctype:image';
            return {
                type: 'avatar',
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