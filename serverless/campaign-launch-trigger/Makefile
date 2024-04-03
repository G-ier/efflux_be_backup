AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 524744845066
AWS_PROFILE ?= efflux
STACK_NAME ?= Efflux-Campaign-Launch-Trigger

deploy-stack:
	@echo "Deploying stack using SAM"
	@sam deploy \
		--no-confirm-changeset \
		--template-file template.yaml \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE) \
    --resolve-s3 \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides \
			ParameterKey=AWSRegion,ParameterValue=$(AWS_REGION) \
			ParameterKey=AWSAccountId,ParameterValue=$(AWS_ACCOUNT_ID) \
			ParameterKey=AWSProfile,ParameterValue=$(AWS_PROFILE)

destroy-stack:
	@echo "Destroying stack using SAM"
	@sam delete \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE)

tail-logs:
	@echo "Tailing logs for stack $(STACK_NAME)"
	@sam logs \
		--stack-name $(STACK_NAME) \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE) \
		--tail

run-local:
	@echo "Running function locally"
	@sam local invoke \
		--template template.yaml \
		--event events/event.json \
		--region $(AWS_REGION) \
		--profile $(AWS_PROFILE) \
		--debug
