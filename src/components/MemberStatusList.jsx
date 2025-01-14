import React, { useState } from "react";
import styled from "styled-components";
import { ListContainer, ListItem } from "./StyledComponents/LayoutStyles";

// 활동 상태 표시 초록불
const ActiveStatus = styled.div`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: ${({ isActive }) => (isActive ? "green" : "#bbbbbb")};
  margin-left: auto;
  cursor: ${({ isActive }) => (isActive ? "pointer" : "default")};
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
  margin-bottom: 2.5rem;
`;

const MemberStatusList = ({ members }) => {
  const [showTime, setShowTime] = useState(Array(members.length).fill(false)); // 배열로 관리하게끔

  const toggleShowTime = (index, isActive) => {
    if (!isActive) return; // 비활성화 상태에서는 클릭 불가능 하도록
    setShowTime((prev) =>
      prev.map((state, i) => (i === index ? !state : state))
    );
  };

  // 활동 시간 계산 로직
  const calculateActiveTime = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes}`;
  };

  return (
    <MemberListContainer>
      {members.map((member, index) => (
        <ListItem key={index}>
          {member.generation}기 {member.name}
          {showTime[index] ? (
            <ActiveTime onClick={() => toggleShowTime(index, member.isActive)}>
              {calculateActiveTime(member.activeSince)}
            </ActiveTime>
          ) : (
            <ActiveStatus
              isActive={member.isActive}
              onClick={() => toggleShowTime(index, member.isActive)}
            />
          )}
        </ListItem>
      ))}
    </MemberListContainer>
  );
};

export default MemberStatusList;
