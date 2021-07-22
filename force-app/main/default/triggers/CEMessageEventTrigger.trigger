
/**
 * after publish a CE Message Event, will record email and send eamil
 */
trigger CEMessageEventTrigger on demo_CE_Message_Event__e (after insert) {

    List<EmailMessage> emailMessages = new List<EmailMessage>();
    for (demo_CE_Message_Event__e event : Trigger.New) {
            //templateId, whoId, whatId
            if (event.Template_Id__c && event.Who_Id__c && event.What_Id__c){
                Messaging.SingleEmailMessage email = Messaging.renderStoredEmailTemplate(event.Template_Id__c, event.Who_Id__c, event.What_Id__c);
                EmailMessage em = new EmailMessage();
                em.Subject = email.getSubject();
                em.HtmlBody = email.getHtmlBody();
                em.ToAddress = Uitls.join(email.getToAddresses(), ';');
                em.CcAddress = Uitls.join(email.getCcAddresses(), ';');
                em.BccAddress = Uitls.join(email.getBccAddresses(), ';');
                em.BccAddress = Uitls.join(email.getBccAddresses(), ';');
                em.Status = '3';
                //em.ToAddress = email.getToAddresses();
                emailMessages.add(em);
            }
    }
    insert emailMessages;
}