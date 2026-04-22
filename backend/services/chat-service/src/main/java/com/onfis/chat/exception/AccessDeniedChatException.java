package com.onfis.chat.exception;

public class AccessDeniedChatException extends RuntimeException {
    public AccessDeniedChatException(String message) {
        super(message);
    }
}