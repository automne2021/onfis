package com.onfis.chat.service;

import io.livekit.server.AccessToken;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LiveKitService {

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    /**
     * Tạo token để user tham gia vào phòng LiveKit
     */
    public String createToken(String roomName, String userId, String userName) {
        // Khởi tạo AccessToken với key và secret
        AccessToken token = new AccessToken(apiKey, apiSecret);
        
        // Cấp danh tính cho user
        token.setIdentity(userId); 
        token.setName(userName);   

        // Cấp quyền: Được phép Join vào đúng cái Room này
        token.addGrants(new RoomJoin(true), new RoomName(roomName));

        // Trả về chuỗi JWT Token
        return token.toJwt();
    }
}