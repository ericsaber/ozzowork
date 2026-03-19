import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";
import { format } from "date-fns";
import type { useLogInteraction } from "@/hooks/useLogInteraction";

type LogInteractionState = ReturnType<typeof useLogInteraction>;

interface LogInteractionContentProps {
  state: LogInteractionState;
  onKeepEditing?: () => void;
  addLog?: (msg: string) => void;
}

const LogInteractionContent = ({ state, onKeepEditing, addLog }: LogInteractionContentProps) => {
  const {
    step, contactId, setContactId, connectType, setConnectType,
    note, setNote, contactName, isContactPrefilled, contacts,
    showQuickAdd, quickForm, setQuickForm, quickAddContact,
    logMutation, followupMutation,
    handleSkip, handleAddNewContact, handleUpdateLog, handleChangeContact, handleAddInteraction,
    showDiscardDialog, handleDiscardKeep, handleDiscardConfirm,
    skippedInteraction, skipFollowupStep, connectDate, setConnectDate,
    showQuickAddState,
  } = state;

  const [, setShowQuickAdd] = showQuickAddState;

  return (
    <>
      <div className="overflow-y-auto px-5 pb-6">
        {!skipFollowupStep && <StepIndicator currentStep={step} />}

        {step === 1 ? (
          <div className="space-y-5">
            {showQuickAdd && (
              <div className="p-3 rounded-[12px] border border-border bg-card animate-fade-in">
                <p className="text-[12px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)" }}>Quick-add contact</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="First Name *" value={quickForm.first_name} onChange={(e) => setQuickForm({ ...quickForm, first_name: e.target.value })} className="h-9 text-sm bg-background" />
                    <Input placeholder="Last Name" value={quickForm.last_name} onChange={(e) => setQuickForm({ ...quickForm, last_name: e.target.value })} className="h-9 text-sm bg-background" />
                  </div>
                  <Input placeholder="Company" value={quickForm.company} onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })} className="h-9 text-sm bg-background" />
                  <Input placeholder="Phone" value={quickForm.phone} onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })} className="h-9 text-sm bg-background" />
                  <Input placeholder="Email" type="email" value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} className="h-9 text-sm bg-background" />
                  <Button size="sm" onClick={() => quickAddContact.mutate()} disabled={!quickForm.first_name || quickAddContact.isPending} className="w-full">
                    {quickAddContact.isPending ? "Creating..." : "Create & Select"}
                  </Button>
                </div>
              </div>
            )}
            <LogStep1
              connectType={connectType}
              setConnectType={setConnectType}
              note={note}
              setNote={setNote}
              onSubmit={() => logMutation.mutate()}
              isSubmitting={logMutation.isPending}
              disabled={!contactId}
              contactId={contactId}
              contactName={contactName}
              isContactPrefilled={isContactPrefilled}
              contacts={contacts}
              onContactSelect={setContactId}
              onAddNewContact={handleAddNewContact}
              onSkipToFollowup={skipFollowupStep ? undefined : () => logMutation.mutate()}
              onChangeContact={handleChangeContact}
              submitLabel={skipFollowupStep ? "Save →" : undefined}
              showDateRow={skipFollowupStep}
              connectDate={connectDate}
              setConnectDate={setConnectDate}
            />
          </div>
        ) : (
          <LogStep2
            connectType={connectType}
            contactName={contactName}
            note={note}
            logDate={format(new Date(), "MMM d, yyyy")}
            onBack={() => state.step === 2 ? undefined : undefined}
            onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
            onSkip={handleSkip}
            isSaving={followupMutation.isPending}
            onUpdateLog={handleUpdateLog}
            skippedInteraction={skippedInteraction}
            onAddInteraction={handleAddInteraction}
          />
        )}
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this log?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              handleDiscardKeep();
              onKeepEditing?.();
            }}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LogInteractionContent;
