import { LightningElement, api,track } from 'lwc';

/**
 * attribute apis [showModal, message, modalHeading, emailContent]
 * events: clickclose {detail: {status:string}}
 */
export default class EmailPreview extends LightningElement {

    // dialog attributes and functions
    @api showModal = false;
    @api message;
    @api modalHeading;

    @track attachmentPillItems;

    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    handleClick(event){
        //creates object which will be published to the parent component
        let finalEvent = {
            status: event.target.name
        };

        //dispatch a 'click' event so the parent component can handle it
        this.dispatchEvent(new CustomEvent('clickclose', {detail: finalEvent}));
    }

    // preview attributes and functions
    @api
    emailContent;

    @track
    displayItems = [];

    set emailContent(value){
        this._emailContent = value;
        this.processItems(value);
    }

    get emailContent(){
        return this._emailContent;
    }

    get hidden(){
        return 'slds-hide';
    }

    processItems(content){
        if(!content){
            return;
        }

        this.attachmentPillItems = this.updateAttachmentPillItems(content.attachments||[]);

        this.displayItems = [];
        this.displayItems.push({
            label: 'From',
            value: this.from
        });
        this.displayItems.push({
            label: 'To',
            values: this.toAddrs
        });
        this.displayItems.push({
            label: 'CC',
            values: this.ccAddrs
        });
        this.displayItems.push({
            label: 'BCC',
            values: this.bccAddrs
        });
        this.displayItems.push({
            label: 'Nature',
            value: this.nature
        });
        this.displayItems.push({
            label: 'Subject',
            value: this.subject
        });
        this.displayItems.push({
            label: 'Body Message',
            value: this.htmlBody
        });
        this.displayItems.push({
            label: 'Sensitive',
            value: this.sensitive
        });
    }

    updateAttachmentPillItems(attractList){
        if(!attractList || attractList.length==0){
            return null;
        }
        return attractList.map(e=>{
            let icon = e.filename.indexOf('.pdf')==-1 ?'doctype:pdf':'doctype:image';
            return {
                type: 'avatar',
                href: 'javascript:void(0);',
                label: e.filename,
                name: e.filename,
                src: '/docs/component-library/app/images/examples/avatar2.jpg',
                fallbackIconName: icon,
                variant: 'circle',
                alternativeText: e.filename
            }
        })
    }

    getAddressDisplay(addr){
        var label = '';
        if(addr){
            if(addr.name){
                return addr.name+'<'+addr.email+'>';
            }
            return addr.email;
        }
        return label;
    }

    get from(){
        return this.getAddressDisplay(this.emailContent.fromAddress);
    }

    get showToAddress(){
        return this.emailContent && this.emailContent.personalizations&& this.emailContent.personalizations[0].toAddresses.length>0;
    }
    get showCCAddress(){
        return this.emailContent && this.emailContent.personalizations&& this.emailContent.personalizations[0].ccAddresses.length>0;
    }
    get showBCCAddress(){
        return this.emailContent && this.emailContent.personalizations&& this.emailContent.personalizations[0].bccAddresses.length>0;
    }

    get toAddrs(){
        if(!this.emailContent.personalizations|| !this.emailContent.personalizations[0].toAddresses){
            return [];
        }
        let toAddresses = this.emailContent.personalizations[0].toAddresses;
        return toAddresses.map(e=>{
            return {name:e.email, label:this.getAddressDisplay(e)}
        })
    }
    get ccAddrs(){
        if(!this.emailContent.personalizations || !this.emailContent.personalizations[0].ccAddresses){
            return [];
        }
        let ccAddresses = this.emailContent.personalizations[0].ccAddresses;
        return ccAddresses.map(e=>{
            return {name:e.email, label:this.getAddressDisplay(e)}
        })
    }

    get bccAddrs(){
        if(!this.emailContent.personalizations || !this.emailContent.personalizations[0].bccAddresses){
            return [];
        }
        let bccAddresses = this.emailContent.personalizations[0].bccAddresses;
        return bccAddresses.map(e=>{
            return {name:e.email, label:this.getAddressDisplay(e)}
        })
    }

    get nature(){
        if (this.emailContent.natures && Array.isArray(this.emailContent.natures)) {
            return this.emailContent.natures.join(',') || '';
        }
        return this.emailContent.natures || '';
    }

    get subject(){
        return this.emailContent.subject || '';
    }

    get htmlBody(){
        return (this.emailContent.content && this.emailContent.content.value) || '';
    }

    get sensitive(){
        return this.emailContent.sensitive ? 'Yes' : 'No';
    }
}