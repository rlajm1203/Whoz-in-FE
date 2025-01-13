import React, { useState } from "react";
import styled from "styled-components";
import { ListContainer, ListItem } from "./StyledComponents/LayoutStyles";

// 활동 상태 초록불
const ActiveStatus = styled.div`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: green;
  margin-left: auto;
  cursor: pointer; 
`;

const ActiveTime = styled.span`
  color: gray;
  font-size: 0.9rem;
  margin-left: auto;
  cursor: pointer; 
`;

const MemberListContainer = styled(ListContainer)`
  border-radius: 30px 30px 0 0;
  min-height: 30rem;
`;

const MemberStatusList = ({ members }) => {

  const [showTimeIndex, setShowTimeIndex] = useState(null); 

  // 초록불 클릭하면 시간 표시
  const toggleShowTime = (index) => {
    setShowTimeIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  // 활동 시간 계산 로직
  const calculateActiveTime = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now - start; 
    const hours = Math.floor(diffMs / (1000 * 60 * 60)); // 시간
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); // 분
    return `${hours}:${minutes}`;
  };

  return (
    <MemberListContainer>
      {members.map((member, index) => (
        <ListItem key={index}>
          {member.generation}기 {member.name}
      
          {showTimeIndex === index ? (
            <ActiveTime onClick={() => toggleShowTime(index)}>
              {calculateActiveTime(member.activeSince)}
            </ActiveTime>
          ) : (
            <ActiveStatus onClick={() => toggleShowTime(index)} />
          )}
        </ListItem>
      ))}
    </MemberListContainer>
  );
};

export default MemberStatusList;
