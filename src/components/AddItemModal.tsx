"use client";
import { useState } from "react";
import { Modal, Input, Button } from "@geist-ui/core";

interface Props {
  onClose: () => void;
}

export default function AddItemModal({ onClose }: Props) {
  const [title, setTitle] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    onClose();
  };

  return (
    <Modal visible onClose={onClose}>
      <Modal.Title>Add to watchlist</Modal.Title>
      <Modal.Content>
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          width="100%"
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          crossOrigin={undefined}
        />
      </Modal.Content>
      <Modal.Action 
        passive 
        onClick={onClose} 
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        Cancel
      </Modal.Action>
      <Modal.Action 
        onClick={handleAdd} 
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        Add
      </Modal.Action>
    </Modal>
  );
}