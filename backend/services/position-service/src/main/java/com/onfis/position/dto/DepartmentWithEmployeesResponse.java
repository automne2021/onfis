package com.onfis.position.dto;

import java.util.List;

public record DepartmentWithEmployeesResponse(
        String id,
        String name,
        List<EmployeeResponse> employees
) {}
