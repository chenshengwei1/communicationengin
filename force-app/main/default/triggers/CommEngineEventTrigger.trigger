trigger CommEngineEventTrigger on CommEngineEvent__e (before insert) {
    CommEngineEmailHandler.sendEmail4Event(Trigger.New);
}