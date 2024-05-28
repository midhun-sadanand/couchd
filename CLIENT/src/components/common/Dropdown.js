import React, { useState  } from 'react';


function Dropdown() {
    const [open, setOpen] = useState(false);
    const [selection, setSelection] = useState([false]);
    const toggle = () => setOpen(!open);


    function handleOnClick(item) {
        setSelection([item]);
        toggle(!open);
    }


    return (
        <div className="dd-wrapper">
            <div className="dd-header cursor-pointer px-3 mr-3" onClick={ () => toggle(!open)}>
                <div className="dd-title">
                    <p>{selection[0]? selection[0] : "--"}</p>
                </div>
            </div>
            {open && (
                <ul className="dd-list absolute border-2 rounded-xl bg-white">
                    <li className="dd-list-item px-3 py-1 border-b-2 hover:bg-gray-200">
                        <button type="button" onClick={() => handleOnClick("Not Started")}>Not started</button>
                    </li>
                    <li className="dd-list-item hover:bg-gray-200">
                        <button type="button" onClick={() => handleOnClick("In Progress")}>In Progress</button>
                    </li>
                    <li className="dd-list-item py-1 border-t-2 hover:bg-gray-200">
                            <button type="button" onClick={() => handleOnClick("Completed")}>Completed</button>
                    </li>
                </ul>
                    )}
        </div>
    );
}


export default Dropdown;