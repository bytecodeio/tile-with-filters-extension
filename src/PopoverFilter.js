import React, { useState } from 'react';
import { Select, Button, Popover, IconButton } from '@looker/components';
import { CustomArrowIcon } from './CustomArrowIcon';
import { DashboardFilter } from '@looker/filter-components';
import styled from 'styled-components';


const FlexButton = styled.button`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  gap: 10px;
  width: 313px;
  height: 32px;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  flex: none;
  order: 0;
  flex-grow: 1;
  cursor: pointer;

`;

export const PopoverFilter = ({index, filter, sdk, onChange, expression}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
  
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
      console.log('event.currentTarget', event.currentTarget);
      setIsOpen(!isOpen);
    };
  
    const handleClose = () => {
      setIsOpen(false);
    };
    return (
        <div key={index}>
          
          <Popover
            content={
              <DashboardFilter
                filter={filter}
                sdk={sdk}
                onChange={onChange}
                expression={expression}
              />
            }
            isOpen={isOpen}
            triggerElement={anchorEl}
            onClose={handleClose}
          >
            <FlexButton onClick={handleClick}>
                <span>{filter.name}</span>
                <CustomArrowIcon />
            </FlexButton>
          </Popover>
        </div>
    )
}


export default PopoverFilter;