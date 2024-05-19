import React, { useState } from 'react';

function Dropdown({ items }) {
    const [open, setOpen] = useState(false);
    const [selection, setSelection] = useState([false]);
    const toggle = () => setOpen(!open);

    function handleOnClick(item) {
        setSelection([item]);
        toggle(!open);
    }

    return (
        <div className="dd-wrapper">
            <div className="dd-header" onClick={ () => toggle(!open)}>
                <div className="dd-title">
                    <p>{selection[0]? selection[0] : "--"}</p>
                </div>
            </div>
            {open && (
                <ul className="dd-list">
                    {items.map(item => (
                        <li className="dd-list-item" key={ item.id }>
                            <button type="button" onClick={() => handleOnClick(item.value)}>{ item.value }</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

}

export default Dropdown