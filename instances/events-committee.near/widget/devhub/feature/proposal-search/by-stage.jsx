// The timeline is stored in jsonb. The value is used to search for as part of
// that json so it doesn't need to be an exact match.
const options = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Review", value: "REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Approved - Conditional", value: "CONDITIONAL" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Payment Processing", value: "PAYMENT" },
  { label: "Funded", value: "FUNDED" },
];

const setSelected = props.onStateChange ?? (() => {});

return (
  <div>
    <Widget
      src="${REPL_EVENTS}/widget/devhub.components.molecule.DropDown"
      props={{
        options: options,
        label: "Stage",
        onUpdate: (v) => {
          setSelected(v);
        },
      }}
    />
  </div>
);
