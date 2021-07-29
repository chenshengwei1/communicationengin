public with sharing class EmailCommunicationController {

    @AuraEnabled(cacheable=true)
    public static Map<String,Map<String,String>> getPicklist(String objName, String fieldName) {
        Map<String,Map<String,String>> resultMap = new Map<String,Map<String,String>>();
        resultMap.put('values', new Map<String,String>());
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objName);
        if (targetType != null){
            Sobject Object_name = targetType.newSObject();
            Schema.sObjectType sobjectType = Object_name.getSObjectType();
            Schema.DescribeSObjectResult sobject_describe = sobjectType.getDescribe();
            Map<String, Schema.SObjectField> field_map = sobject_describe.fields.getMap();
            if(null != fieldName){
                Map<String,String> picklistMap = resultMap.get('values'); 
                List<Schema.PicklistEntry> pick_list_values = field_map.get(fieldName).getDescribe().getPickListValues();
                for (Schema.PicklistEntry a : pick_list_values) {
                    if(a.isActive()) {
                        picklistMap.put(a.getValue(), a.getLabel());
                    }
                }
            }
        }
        return resultMap;
    }

    @AuraEnabled(cacheable=true)
    public static EmailTemplateInfo getEmailTemplates(Integer offset, Integer limits, String filterVar){
        return getEmailTemplates(offset,limits,filterVar,new List<String>());
    }

    @AuraEnabled(cacheable=true)
    public static EmailTemplateInfo getEmailTemplates(Integer offset, Integer limits, String filterVar, List<String> folderNames){
        system.debug('offset:' + offset+', limits:'+limits+', filterVar:'+filterVar+', folderName:'+folderNames);
        EmailTemplateInfo response = new EmailTemplateInfo();
        response.result = null;
        response.count = 0;
        
        if(Schema.sObjectType.EmailTemplate.isAccessible() && Schema.sObjectType.Attachment.isAccessible()){
            if (null == offset){
                offset = 0;
            }
            if (null == limits){
                limits = 50000;
            }
            if (filterVar == null || filterVar == '') {
                filterVar = '%%';
            }else{
                filterVar = '%'+filterVar+'%';
            }

            if (null == folderNames || folderNames.size() == 0){
                response.result = new List<EmailTemplate>([SELECT Subject,Id, Name,DeveloperName,HtmlValue,Body,Description,RelatedEntityType, FolderId, Folder.DeveloperName, Folder.Name,
                            (Select Id,Name from Attachments)
                    FROM EmailTemplate
                    WHERE TemplateType IN ('custom','text','html') and Name LIKE :filterVar
                    ORDER BY Name, DeveloperName LIMIT:limits
                    OFFSET:offset]);
                response.count = [SELECT COUNT()
                    FROM EmailTemplate
                    WHERE TemplateType IN ('custom','text','html') and Name LIKE :filterVar];
            }else{
                response.result = new List<EmailTemplate>([SELECT Subject,Id, Name,DeveloperName,HtmlValue,Body,Description,RelatedEntityType, FolderId, Folder.DeveloperName, Folder.Name,
                           (Select Id,Name from Attachments)
                    FROM EmailTemplate
                    WHERE TemplateType IN ('custom','text','html') and Name LIKE :filterVar and Folder.Name in :folderNames
                    ORDER BY Name, DeveloperName LIMIT:limits
                    OFFSET:offset]);
                response.count = [SELECT COUNT()
                    FROM EmailTemplate
                    WHERE TemplateType IN ('custom','text','html') and Name LIKE :filterVar and Folder.Name=:folderNames];
            }
        }
        return response;
    }

    /**
     * render email template 
     * @param templateId required
     * @param whoId recipient contact's Id,  option
     * @param whatId template related to object Id, option
     * @return EmailMsg {
     *              subject:string,
     *              body:string,
     *              fileattachments:{
     *                     attachId:string,
     *                     fileName:string,
     *                     isContentDocument:boolean
     *                  }
     *               }
     */
    @AuraEnabled(cacheable=true)
    public static EmailMsg getTemplateDetails(string templateId, String whoId, String whatId){
        Messaging.SingleEmailMessage email = Messaging.renderStoredEmailTemplate(templateId, whoId, WhatId,Messaging.AttachmentRetrievalOption.METADATA_ONLY);
        EmailMsg msg = new EmailMsg();
        msg.subject = email.getSubject();
        msg.body = email.getHtmlBody();

        List<Messaging.EmailFileAttachment> attachmentList = email.fileAttachments;

        List<FileAttachmentWrapper> fawList = new List<FileAttachmentWrapper>();
        for(Messaging.EmailFileAttachment efa : attachmentList){
           FileAttachmentWrapper faw = new FileAttachmentWrapper();
            faw.attachId = efa.id;
            faw.filename = efa.filename;
            faw.body = efa.body;
            faw.contenttype = efa.contenttype;
            faw.isContentDocument=false;
            fawList.add(faw);
        }
        for(ContentDocumentLink cdl : [Select ContentDocument.Id, ContentDocument.title, ContentDocument.fileExtension, ContentDocument.fileType
                                       from contentdocumentlink
                                       where linkedEntityId=:templateId]){
            FileAttachmentWrapper faw = new FileAttachmentWrapper();
            faw.attachId = cdl.ContentDocument.id;
            if (faw.attachId != null){

            }
            faw.isContentDocument = true;
            faw.filename = cdl.ContentDocument.title+'.'+cdl.contentdocument.fileextension;
            faw.contenttype = cdl.ContentDocument.fileType;
            fawList.add(faw);
        }
        msg.fileattachments = fawList;

        if(String.isblank(msg.body)){
            msg.body = email.getPlainTextBody();
            if(String.isNotBlank(msg.body)){
                msg.body = msg.body.replace('\n', '<br/>');
            }
        }
        return msg;
    }

    @AuraEnabled(cacheable=true)
    public static EmailTemplateInfo searchRecordList(ObjectRecordApi objectApi, FieldRecordApi[] fields, FieldRecordApi[] filterVars, Integer offset, Integer limits){
        system.debug('objectApi:' + objectApi+' fields:'+fields+' filterVars:'+filterVars);
        
        EmailTemplateInfo response = new EmailTemplateInfo();
        response.result = null;
        response.count = 0;
        Schema.DescribeSObjectResult  targetType = Schema.getGlobalDescribe().get(objectApi.objectApiName).getDescribe();
        if(targetType.isAccessible()){
            if (null == offset){
                offset = 0;
            }
            if (null == limits){
                limits = 500;
            }

            if (String.isEmpty(filterVars[0].value) || filterVars[0].value.length() < 2){
                return response;
            }
            
            String limitString = ' LIMIT ' + limits  + ' OFFSET ' + offset;
            String queryString = 'FIND {*'+filterVars[0].value+'*} IN Email Fields RETURNING Contact(name, id, email '+limitString+')';
            System.debug('queryString ***** ' + queryString +limitString);
            
            //FIND {*@p*} IN Email Fields RETURNING Contact(name, id)
            List<List<SObject>> queryRet = search.query(queryString);
            if (queryRet.size() > 0){
                response.result = search.query(queryString).get(0);
                response.count = response.result.size();
            }
        }
        return response;
    }

    @AuraEnabled(cacheable=true)
    public static EmailTemplateInfo getRecordList(ObjectRecordApi objectApi, FieldRecordApi[] fields, FieldRecordApi[] filterVars, Integer offset, Integer limits){
        system.debug('objectApi:' + objectApi+' fields:'+fields+' filterVars:'+filterVars);
        EmailTemplateInfo response = new EmailTemplateInfo();
        response.result = null;
        response.count = 0;
        Schema.DescribeSObjectResult  targetType = Schema.getGlobalDescribe().get(objectApi.objectApiName).getDescribe();
        if(targetType.isAccessible()){
            if (null == offset){
                offset = 0;
            }
            if (null == limits){
                limits = 500;
            }
            

            String queryString = 'SELECT ';
            String searchFieldString = '';
            for (FieldRecordApi field : fields){
                if (String.isNotEmpty(searchFieldString)){
                    searchFieldString+= (',' + field.fieldApiName);
                }else{
                    searchFieldString+= field.fieldApiName;
                }
            }
            String fromString = ' FROM ' + objectApi.objectApiName;
            String condition = '';
            for(FieldRecordApi filterVar : filterVars){
                if(String.isNotEmpty(filterVar.value)){
                    if (String.isEmpty(condition)){
                        condition = condition + ' WHERE ';
                    }else{
                        condition = condition + ' AND ';
                    }
                    condition = condition + filterVar.fieldApiName+' LIKE \'%' +filterVar.value + '%\'';
                }
            }
            
            String orderBy = ' ORDER BY Id ASC';
            String limitString = ' LIMIT ' + limits  + ' OFFSET ' + offset;
            System.debug('queryString ***** ' + queryString + searchFieldString + fromString +condition+orderBy+limitString);
            
            response.result = Database.query(queryString + searchFieldString + fromString +condition+orderBy+limitString);
            response.count = Database.countQuery(queryString + ' COUNT()' + fromString +condition);
        }
        return response;
    }
    
    public class FileAttachmentWrapper{
        @AuraEnabled public String attachId;
        @AuraEnabled public String fileName;
        @AuraEnabled public boolean isContentDocument;
        @AuraEnabled public Blob body;
        @AuraEnabled public String contenttype;
         
    }
    public class EmailMsg{
        @AuraEnabled public string subject;
        @AuraEnabled public string body;
        @AuraEnabled public List<FileAttachmentWrapper> fileAttachments;
       // @AuraEnabled publi List<String> attach
    }
    public class EmailTemplateInfo{
        @AuraEnabled public List<SObject> result 	                {get; set;}
        @AuraEnabled public Integer count 				                {get; set;}
    }
    public class ObjectRecordApi{
        @AuraEnabled public String objectApiName 	                {get; set;}
    }
    public class FieldRecordApi{
        @AuraEnabled public String objectApiName 	                {get; set;}
        @AuraEnabled public String fieldApiName 	                {get; set;}
        @AuraEnabled public String value         	                {get; set;}
    }
}