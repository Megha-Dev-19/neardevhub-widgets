const { href: linkHref } = VM.require(`${REPL_DEVHUB}/widget/core.lib.url`);

linkHref || (linkHref = () => {});

const isOpen = props.isOpen;
const isEdit = props.isEdit;
const proposalId = props.proposalId;

const Modal = styled.div`
  display: ${({ hidden }) => (hidden ? "none" : "flex")};
  position: fixed;
  inset: 0;
  justify-content: center;
  align-items: center;
  opacity: 1;
  z-index: 999;

  .black-btn {
    background-color: #000 !important;
    border: none;
    color: white;
    &:active {
      color: white;
    }
  }

  @media screen and (max-width: 768px) {
    h5 {
      font-size: 16px !important;
    }
  }

  .btn {
    font-size: 14px;
  }

  .btn-blue {
    background-image: linear-gradient(to bottom, #4b7a93, #213236);
    color: white;
  }
`;

const ModalBackdrop = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.9);
  opacity: 0.9;
`;

const ModalDialog = styled.div`
  padding: 2em;
  z-index: 999;
  overflow-y: auto;
  max-height: 85%;
  margin-top: 5%;
  width: 30%;

  @media screen and (max-width: 768px) {
    margin: 2rem;
    width: 100%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4px;
`;

const ModalFooter = styled.div`
  padding-top: 4px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: items-center;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 0.5em;
  border-radius: 6px;
  border: 0;
  color: #344054;

  &:hover {
    background-color: #d3d3d3;
  }
`;

const ConfirmButton = styled.button`
  padding: 0.7em;
  border-radius: 6px;
  border: 0;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  background-color: #12b76a;
  color: white;

  &:hover {
    background-color: #0e9f5d;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 4px;
  overflow-y: auto;
  max-height: 50%;

  @media screen and (max-width: 768px) {
    font-size: 12px !important;
  }
`;

const NoButton = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  box-shadow: none;
`;

return (
  <>
    <Modal hidden={!isOpen}>
      <ModalBackdrop />
      <ModalDialog className="card">
        <ModalHeader>
          <h5 className="mb-0">
            Your Proposal has been successfully{" "}
            {!isEdit ? "published" : "edited"}.
          </h5>
        </ModalHeader>

        <div className="d-flex gap-2 justify-content-center mt-2">
          <Link
            to={linkHref({
              widgetSrc: `${REPL_TREASURY_TEMPLAR}/widget/portal`,
              params: { page: "proposal", id: proposalId },
            })}
          >
            <Widget
              src={`${REPL_DEVHUB}/widget/devhub.components.molecule.Button`}
              props={{
                classNames: { root: "btn-blue" },
                label: "View Proposal",
                onClick: () => {},
              }}
            />
          </Link>
        </div>
      </ModalDialog>
    </Modal>
  </>
);
